import React, { useState, useEffect } from 'react';
import { Video, Phone, X, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface VideoCallInviteProps {
  userRole: 'coach' | 'student';
  partnerId: string;
  partnerName: string;
  onCallStart?: () => void;
  className?: string;
}

interface CallInvitation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_user_name: string;
  to_user_name: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  created_at: string;
  expires_at: string;
}

export function VideoCallInvite({ 
  userRole, 
  partnerId, 
  partnerName, 
  onCallStart,
  className = '' 
}: VideoCallInviteProps) {
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<CallInvitation | null>(null);
  const [receivedInvite, setReceivedInvite] = useState<CallInvitation | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Listen for real-time call invitations
    const inviteChannel = supabase
      .channel(`call-invites-${user.id}`)
      .on('broadcast', { event: 'new_call_invite' }, (payload) => {
        const invite = payload.payload as CallInvitation;
        if (invite.to_user_id === user.id && invite.status === 'pending') {
          setReceivedInvite(invite);
        }
      })
      .on('broadcast', { event: 'invite_response' }, (payload) => {
        const { inviteId, status } = payload.payload;
        if (pendingInvite?.id === inviteId) {
          if (status === 'accepted') {
            // Start the video call
            onCallStart?.();
          }
          setPendingInvite(null);
        }
      })
      .subscribe();

    // Check for existing pending invitations
    checkPendingInvitations();

    return () => {
      supabase.removeChannel(inviteChannel);
    };
  }, [user?.id, partnerId]);

  const checkPendingInvitations = async () => {
    if (!user?.id) return;

    try {
      // Check for outgoing invites (sent by current user)
      const { data: outgoingInvites } = await supabase
        .from('video_call_invites')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('to_user_id', partnerId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (outgoingInvites && outgoingInvites.length > 0) {
        setPendingInvite(outgoingInvites[0]);
      }

      // Check for incoming invites (received by current user)
      const { data: incomingInvites } = await supabase
        .from('video_call_invites')
        .select('*')
        .eq('to_user_id', user.id)
        .eq('from_user_id', partnerId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (incomingInvites && incomingInvites.length > 0) {
        setReceivedInvite(incomingInvites[0]);
      }
    } catch (error) {
      console.error('Error checking pending invitations:', error);
    }
  };

  const sendInvitation = async () => {
    if (!user?.id || !partnerId) return;

    setIsInviting(true);
    try {
      // Create invitation record
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

      const invitation: Partial<CallInvitation> = {
        from_user_id: user.id,
        to_user_id: partnerId,
        from_user_name: user.user_metadata?.full_name || user.email,
        to_user_name: partnerName,
        status: 'pending',
        message: inviteMessage.trim() || 'Video görüşme daveti',
        expires_at: expiresAt.toISOString()
      };

      const { data: savedInvite, error } = await supabase
        .from('video_call_invites')
        .insert(invitation)
        .select()
        .single();

      if (error) throw error;

      setPendingInvite(savedInvite);
      setInviteMessage('');

      // Send real-time notification to recipient
      const notificationChannel = supabase.channel(`call-invites-${partnerId}`);
      await notificationChannel.send({
        type: 'broadcast',
        event: 'new_call_invite',
        payload: savedInvite
      });

      // Send push notification
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: partnerId,
            title: '📹 Video Görüşme Daveti',
            body: `${invitation.from_user_name} size video görüşme daveti gönderiyor: "${invitation.message}"`,
            data: {
              type: 'video_call_invite',
              inviteId: savedInvite.id,
              fromUserId: user.id,
              fromUserName: invitation.from_user_name
            }
          })
        });
      } catch (notificationError) {
        console.error('Failed to send push notification:', notificationError);
      }

    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Davet gönderilirken hata oluştu');
    } finally {
      setIsInviting(false);
    }
  };

  const respondToInvitation = async (response: 'accepted' | 'declined') => {
    if (!receivedInvite) return;

    try {
      // Update invitation status
      const { error } = await supabase
        .from('video_call_invites')
        .update({ status: response })
        .eq('id', receivedInvite.id);

      if (error) throw error;

      // Send response notification to sender
      const responseChannel = supabase.channel(`call-invites-${receivedInvite.from_user_id}`);
      await responseChannel.send({
        type: 'broadcast',
        event: 'invite_response',
        payload: {
          inviteId: receivedInvite.id,
          status: response,
          responderName: partnerName
        }
      });

      if (response === 'accepted') {
        // Start the video call
        onCallStart?.();
      }

      setReceivedInvite(null);

    } catch (error) {
      console.error('Error responding to invitation:', error);
      alert('Davet yanıtlanırken hata oluştu');
    }
  };

  const cancelInvitation = async () => {
    if (!pendingInvite) return;

    try {
      const { error } = await supabase
        .from('video_call_invites')
        .update({ status: 'expired' })
        .eq('id', pendingInvite.id);

      if (error) throw error;

      setPendingInvite(null);
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  // Received invitation UI
  if (receivedInvite) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Video className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900">
              📹 Video Görüşme Daveti
            </h3>
            <p className="text-blue-700 mt-1">
              <strong>{receivedInvite.from_user_name}</strong> size video görüşme daveti gönderiyor
            </p>
            {receivedInvite.message && (
              <p className="text-blue-600 text-sm mt-1 italic">
                "{receivedInvite.message}"
              </p>
            )}
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => respondToInvitation('accepted')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Kabul Et</span>
              </button>
              <button
                onClick={() => respondToInvitation('declined')}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>Reddet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending invitation UI (for sender)
  if (pendingInvite) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900">
              Davet Gönderildi
            </h3>
            <p className="text-yellow-700 mt-1">
              <strong>{partnerName}</strong> adlı kişiye video görüşme daveti gönderildi
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              Yanıt bekleniyor...
            </p>
            <button
              onClick={cancelInvitation}
              className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm mt-2"
            >
              <X className="h-4 w-4" />
              <span>Daveti İptal Et</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Send invitation UI
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Video Görüşme Daveti Gönder
          </h3>
          <p className="text-gray-600 mt-1">
            <strong>{partnerName}</strong> adlı kişiye video görüşme daveti gönder
          </p>
          
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Davet Mesajı (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Örn: Matematik konusunu görüşelim"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              maxLength={100}
            />
          </div>

          <button
            onClick={sendInvitation}
            disabled={isInviting}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="h-4 w-4" />
            <span>{isInviting ? 'Gönderiliyor...' : 'Davet Gönder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 