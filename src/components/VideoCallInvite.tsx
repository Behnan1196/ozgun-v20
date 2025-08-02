import React, { useState, useEffect } from 'react';
import { Video, User, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface VideoCallInviteProps {
  userRole: 'coach' | 'student';
  partnerId: string;
  partnerName: string;
  onCallStart?: () => void;
  className?: string;
}



export function VideoCallInvite({ 
  userRole, 
  partnerId, 
  partnerName, 
  onCallStart,
  className = '' 
}: VideoCallInviteProps) {
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [justSentInvite, setJustSentInvite] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  const sendInvitation = async () => {
    if (!user?.id || !partnerId) return;

    // Video invite system is temporarily disabled during notification cleanup
    alert('Video daveti gönderme özelliği şu anda mevcut değil. Bildirim sistemi güncelleniyor.');
    return;
  };

    // Show confirmation message if just sent an invite
  if (justSentInvite) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900">
              ✅ Davet Gönderildi!
            </h3>
            <p className="text-green-700 mt-1">
              <strong>{partnerName}</strong> adlı kişiye video görüşme daveti gönderildi
            </p>
            <p className="text-green-600 text-sm mt-1">
              Bildirim gönderildi. Başka bir davet göndermek isterseniz aşağıdaki formu kullanabilirsiniz.
            </p>
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
            <strong>{partnerName}</strong> adlı kişiye video görüşme daveti gönder
          </h3>
          
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