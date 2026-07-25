import { Resend } from "resend";

// Initialize Resend only if API key exists, otherwise mock it
let resend;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.warn(' RESEND_API_KEY not found. Email notifications will be logged only.');
    resend = null;
  }
} catch (error) {
  console.warn('Resend initialization failed. Email notifications will be logged only.');
  resend = null;
}

const emailService = {
  // Send buddy connection request email
  sendConnectionRequestEmail: async (recipientEmail, recipientName, senderName, senderEmail) => {
    try {
      if (!resend) {
        console.log('[EMAIL LOG] Connection Request:', {
          to: recipientEmail,
          recipientName,
          senderName,
          subject: `${senderName} sent you a Buddy Connect request! `
        });
        return { id: 'mock-' + Date.now(), success: true };
      }

      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@kforum.online',
        to: recipientEmail,
        subject: `${senderName} sent you a Buddy Connect request! `,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
              <h2 style="margin: 0;">🎉 New Buddy Connect Request!</h2>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
              <p style="color: #555; font-size: 15px; line-height: 1.6;">
                <strong>${senderName}</strong> has sent you a Buddy Connect request on K-Forum! This is a great way to network with fellow students and have private conversations.
              </p>
              <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #667eea; font-weight: bold;"> What's next?</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                  Visit K-Forum to accept or reject this request. Once accepted, you'll be able to chat privately with ${senderName}!
                </p>
              </div>
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL || 'https://k-forum-tau.vercel.app'}/buddy-connect" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  View Request
                </a>
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                K-Forum Buddy Connect System | Connecting Students 
              </p>
            </div>
          </div>
        `
      });

      if (response.error) {
        console.error(' Resend API error (request):', response.error);
      } else {
        console.log(' Connection request email sent:', response.data?.id);
      }
      return response;
    } catch (error) {
      console.error(' Error sending connection request email:', error.message);
      throw error;
    }
  },

  // Send connection accepted email
  sendConnectionAcceptedEmail: async (recipientEmail, recipientName, acceptorName) => {
    try {
      if (!resend) {
        console.log(' [EMAIL LOG] Connection Accepted:', {
          to: recipientEmail,
          recipientName,
          acceptorName,
          subject: `${acceptorName} accepted your Buddy Connect request! 🎊`
        });
        return { id: 'mock-' + Date.now(), success: true };
      }

      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@kforum.online',
        to: recipientEmail,
        subject: `${acceptorName} accepted your Buddy Connect request! 🎊`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
              <h2 style="margin: 0;"> Buddy Connect Accepted!</h2>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
              <p style="color: #555; font-size: 15px; line-height: 1.6;">
                Great news! <strong>${acceptorName}</strong> has accepted your Buddy Connect request!
              </p>
              <div style="background: white; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #28a745; font-weight: bold;">💬 Start chatting now!</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                  You can now have private conversations with ${acceptorName} on K-Forum.
                </p>
              </div>
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL || 'https://k-forum-tau.vercel.app'}/buddy-connect" 
                   style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Go to Chat
                </a>
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                K-Forum Buddy Connect System | Connecting Students 
              </p>
            </div>
          </div>
        `
      });

      if (response.error) {
        console.error(' Resend API error (accepted):', response.error);
      } else {
        console.log(' Connection accepted email sent:', response.data?.id);
      }
      return response;
    } catch (error) {
      console.error(' Error sending connection accepted email:', error.message);
      throw error;
    }
  },

  // Send connection rejected email
  sendConnectionRejectedEmail: async (recipientEmail, recipientName, rejectorName) => {
    try {
      if (!resend) {
        console.log(' [EMAIL LOG] Connection Rejected:', {
          to: recipientEmail,
          recipientName,
          rejectorName,
          subject: 'Buddy Connect Request Response'
        });
        return { id: 'mock-' + Date.now(), success: true };
      }

      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@kforum.online',
        to: recipientEmail,
        subject: 'Buddy Connect Request Response',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
              <h2 style="margin: 0;">Buddy Connect Update</h2>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #333; font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
              <p style="color: #555; font-size: 15px; line-height: 1.6;">
                Your Buddy Connect request to <strong>${rejectorName}</strong> could not be accepted at this time. Don't worry, there are many other students to connect with on K-Forum!
              </p>
              <div style="background: white; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #ffc107; font-weight: bold;"> Keep exploring!</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                  Visit the Buddy Connect section to find more people to connect with.
                </p>
              </div>
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL || 'https://k-forum-tau.vercel.app'}/buddy-connect" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Find More Buddies
                </a>
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                K-Forum Buddy Connect System | Connecting Students 
              </p>
            </div>
          </div>
        `
      });

      if (response.error) {
        console.error(' Resend API error (rejected):', response.error);
      } else {
        console.log(' Connection rejected email sent:', response.data?.id);
      }
      return response;
    } catch (error) {
      console.error(' Error sending connection rejected email:', error.message);
      throw error;
    }
  }
};

export default emailService;