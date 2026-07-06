import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { sendEmail } from './mail.js';

/**
 * Creates an in-app notification and dispatches an email if allowed by user preferences.
 * @param {Object} params
 * @param {string} params.recipient - User ID of the recipient
 * @param {string} [params.sender] - User ID of the sender (optional)
 * @param {string} params.type - Enum ('PROJECT_ASSIGNED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'NOTE_ADDED')
 * @param {string} params.title - Alert title
 * @param {string} params.message - Alert body message
 * @param {string} [params.link] - Redirection route (optional)
 */
export async function createNotification({ recipient, sender, type, title, message, link }) {
  try {
    // 1. Save notification to database
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
    });

    // 2. Fetch user preferences
    const user = await User.findById(recipient);
    if (!user) return notification;

    // Check preference depending on type
    let shouldSendEmail = false;
    if (['PROJECT_ASSIGNED', 'TASK_ASSIGNED', 'TASK_UPDATED'].includes(type)) {
      shouldSendEmail = user.notifications?.taskUpdates ?? true;
    } else if (type === 'NOTE_ADDED') {
      shouldSendEmail = user.notifications?.projectDigest ?? true;
    }

    // 3. Dispatch email if preference matches
    if (shouldSendEmail && user.email) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg">
          <h2 style="color: #4f46e5; margin-bottom: 10px;">${title}</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">${message}</p>
          ${link ? `
            <div style="margin-top: 20px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}${link}" 
                 style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                 View Details
              </a>
            </div>
          ` : ''}
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #64748b;">You received this notification because you are registered on ProFlow Workspace. You can manage your preferences inside Settings.</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: `[ProFlow] ${title}`,
        html: emailHtml,
      });
    }

    return notification;
  } catch (error) {
    console.error("Error creating/dispatching notification:", error);
  }
}
