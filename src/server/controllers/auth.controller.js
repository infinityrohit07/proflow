import { User } from '../models/user.model.js';
import { Activity } from '../models/activity.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { sendEmail } from '../utils/mail.js';

const parseUserAgent = (userAgent) => {
  if (!userAgent) return 'Windows Desktop - Chrome Browser';
  let os = 'Windows Desktop';
  if (userAgent.includes('Windows')) os = 'Windows Desktop';
  else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'MacBook Air';
  else if (userAgent.includes('iPhone')) os = 'iPhone';
  else if (userAgent.includes('iPad')) os = 'iPad';
  else if (userAgent.includes('Android')) os = 'Android Device';
  else if (userAgent.includes('Linux')) os = 'Linux Desktop';

  let browser = 'Chrome';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) browser = 'Chrome';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  return `${os} - ${browser} Browser`;
};

const getLocationFromIp = async (ip) => {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.startsWith('192.168.')) {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.city && data.country_name) {
        return `${data.city}, ${data.country_name}`;
      }
    } catch (e) {
      // fallback
    }
    return 'Birgunj, Nepal';
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    if (data && data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    }
  } catch (e) {
    // fallback
  }
  return 'Birgunj, Nepal';
};

const generateAccessAndRefreshTokens = async (userId, req = null, oldToken = null) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    let ip = '127.0.0.1';
    let device = 'Windows Desktop - Chrome Browser';
    let location = 'Birgunj, Nepal';

    if (req) {
      ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
      }
      device = parseUserAgent(req.headers['user-agent']);
      location = await getLocationFromIp(ip);
    }

    if (oldToken) {
      const session = user.sessions.find(s => s.token === oldToken);
      if (session) {
        session.token = refreshToken;
        session.lastActive = new Date();
        session.ip = ip;
        session.device = device;
        session.location = location;
      } else {
        user.sessions.push({
          token: refreshToken,
          device,
          ip,
          location,
          lastActive: new Date()
        });
      }
    } else {
      user.sessions.push({
        token: refreshToken,
        device,
        ip,
        location,
        lastActive: new Date()
      });
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(500, 'Something went wrong while generating tokens');
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (!fullname || !email || !username || !password) {
    throw new ApiError(400, 'All fields are required');
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  const avatarLocalPath = req.file?.path;
  let avatar = null;
  if (avatarLocalPath) {
    const cloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);
    if (cloudinaryResponse) {
      avatar = { url: cloudinaryResponse.secure_url, publicId: cloudinaryResponse.public_id };
    }
  }

  const user = await User.create({
    fullname,
    avatar: avatar || { url: "", publicId: "" },
    email,
    password,
    username: username.toLowerCase()
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering user');
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, 'Username or email is required');
  }

  const loginIdentifier = email || username;

  const user = await User.findOne({
    $or: [{ username: loginIdentifier }, { email: loginIdentifier }]
  });

  if (!user) {
    throw new ApiError(404, 'User does not exist');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, req);

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

  // In development (HTTP localhost), secure must be false or the browser rejects the cookie.
  // In production (HTTPS), secure:true + sameSite:'none' is required.
  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    // refreshToken is intentionally NOT included in the JSON body.
    // It lives only in the httpOnly cookie — JS cannot read it (XSS-safe).
    .json(new ApiResponse(200, { user: loggedInUser, accessToken }, 'User logged in successfully'));
});

export const logoutUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (incomingRefreshToken) {
    const user = await User.findById(req.user._id);
    if (user) {
      user.sessions = user.sessions.filter(s => s.token !== incomingRefreshToken);
      if (user.refreshToken === incomingRefreshToken) {
        user.refreshToken = user.sessions[0]?.token || "";
      }
      await user.save({ validateBeforeSave: false });
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const sessionExists = user.sessions.some(s => s.token === incomingRefreshToken);
    if (!sessionExists && incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id, req, incomingRefreshToken);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      // Rotation: new refresh token is set in the httpOnly cookie.
      // Old token is invalidated in the session store above.
      // Only the new access token is returned in JSON for the Authorization header.
      .json(new ApiResponse(200, { accessToken }, 'Access token refreshed'));
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { 
    fullname, email, username, bio, jobTitle, themePreference, 
    accentColor, layoutDensity, notifications, socialLinks, aiPreference, 
    aiTone, aiInstructions, removeAvatar 
  } = req.body;
  const user = await User.findById(req.user._id);

  if (fullname) user.fullname = fullname;
  if (email) user.email = email;
  if (username) user.username = username;
  if (bio !== undefined) user.bio = bio;
  if (jobTitle !== undefined) user.jobTitle = jobTitle;
  if (themePreference) user.themePreference = themePreference;
  if (accentColor) user.accentColor = accentColor;
  if (layoutDensity) user.layoutDensity = layoutDensity;

  if (socialLinks) {
    try {
      const parsedSocial = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      user.socialLinks = {
        github: parsedSocial.github !== undefined ? parsedSocial.github : (user.socialLinks?.github || ""),
        linkedin: parsedSocial.linkedin !== undefined ? parsedSocial.linkedin : (user.socialLinks?.linkedin || ""),
        twitter: parsedSocial.twitter !== undefined ? parsedSocial.twitter : (user.socialLinks?.twitter || ""),
        website: parsedSocial.website !== undefined ? parsedSocial.website : (user.socialLinks?.website || "")
      };
    } catch (e) {
      console.error("Error parsing socialLinks:", e);
    }
  }

  if (notifications) {
    try {
      const parsedNotifications = typeof notifications === 'string' ? JSON.parse(notifications) : notifications;
      user.notifications = {
        taskUpdates: parsedNotifications.taskUpdates !== undefined ? parsedNotifications.taskUpdates : (user.notifications?.taskUpdates ?? true),
        projectDigest: parsedNotifications.projectDigest !== undefined ? parsedNotifications.projectDigest : (user.notifications?.projectDigest ?? true),
        weeklyDigest: parsedNotifications.weeklyDigest !== undefined ? parsedNotifications.weeklyDigest : (user.notifications?.weeklyDigest ?? true)
      };
    } catch (e) {
      console.error("Error parsing notifications:", e);
    }
  }

  if (aiPreference) {
    try {
      const parsedAiPref = typeof aiPreference === 'string' ? JSON.parse(aiPreference) : aiPreference;
      user.aiPreference = {
        tone: parsedAiPref.tone || user.aiPreference?.tone || 'professional',
        instructions: parsedAiPref.instructions !== undefined ? parsedAiPref.instructions : (user.aiPreference?.instructions || ''),
        autoSummarize: parsedAiPref.autoSummarize !== undefined ? parsedAiPref.autoSummarize : (user.aiPreference?.autoSummarize ?? true),
        suggestionLevel: parsedAiPref.suggestionLevel || user.aiPreference?.suggestionLevel || 'medium'
      };
    } catch (e) {
      console.error("Error parsing aiPreference:", e);
    }
  } else if (aiTone || aiInstructions !== undefined) {
    user.aiPreference = {
      tone: aiTone || user.aiPreference?.tone || 'professional',
      instructions: aiInstructions !== undefined ? aiInstructions : (user.aiPreference?.instructions || ''),
      autoSummarize: user.aiPreference?.autoSummarize ?? true,
      suggestionLevel: user.aiPreference?.suggestionLevel || 'medium'
    };
  }

  if (removeAvatar === 'true') {
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }
    user.avatar = { url: "", publicId: "" };
  }

  if (req.file) {
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }
    const uploadRes = await uploadOnCloudinary(req.file.path);
    if (uploadRes) {
      user.avatar = {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
      };
    }
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select('-password');
  return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new passwords are required");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully"));
});

export const getUserActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ user: req.user._id })
    .populate('project', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json(new ApiResponse(200, activities, 'User activities fetched successfully'));
});

export const getActiveSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const currentToken = req.cookies.refreshToken || req.header('Authorization')?.replace('Bearer ', '');

  const sessions = user.sessions.map(s => ({
    _id: s._id,
    device: s.device,
    ip: s.ip,
    location: s.location,
    lastActive: s.lastActive,
    isCurrent: s.token === currentToken
  }));

  return res.status(200).json(new ApiResponse(200, sessions, "Active sessions fetched successfully"));
});

export const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const targetSession = user.sessions.id(sessionId);
  if (!targetSession) {
    throw new ApiError(404, "Session not found");
  }

  const currentToken = req.cookies.refreshToken || req.header('Authorization')?.replace('Bearer ', '');
  const isCurrent = targetSession.token === currentToken;

  user.sessions.pull(sessionId);
  if (user.refreshToken === targetSession.token) {
    user.refreshToken = user.sessions[0]?.token || "";
  }
  await user.save({ validateBeforeSave: false });

  if (isCurrent) {
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    };
    return res
      .status(200)
      .clearCookie('accessToken', options)
      .clearCookie('refreshToken', options)
      .json(new ApiResponse(200, { loggedOut: true }, "Current session revoked, logged out"));
  }

  return res.status(200).json(new ApiResponse(200, {}, "Session revoked successfully"));
});

export const revokeAllOtherSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const currentToken = req.cookies.refreshToken || req.header('Authorization')?.replace('Bearer ', '');

  const currentSession = user.sessions.find(s => s.token === currentToken);
  user.sessions = currentSession ? [currentSession] : [];
  user.refreshToken = currentSession ? currentSession.token : "";
  
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "All other sessions revoked successfully"));
});

export const initiateGoogleOAuth = asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new ApiError(400, 'Google OAuth credentials are not configured in the backend .env file. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;
  
  let state = 'login';
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (decoded?._id) {
        state = `connect:${decoded._id}`;
      }
    } catch (e) {
      // Invalid token
    }
  }

  const options = {
    redirect_uri: redirectUri,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    state: state,
  };

  const qs = new URLSearchParams(options);
  return res.redirect(`${rootUrl}?${qs.toString()}`);
});

export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    throw new ApiError(400, 'Authorization code not provided by Google');
  }

  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/v1/auth/google/callback`;

  // 1. Exchange authorization code for tokens
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  let tokenRes;
  try {
    tokenRes = await axios.post(tokenUrl, new URLSearchParams(values).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  } catch (error) {
    console.error('Error exchanging Google OAuth code:', error.response?.data || error.message);
    throw new ApiError(400, 'Failed to authenticate with Google OAuth server');
  }

  const { access_token } = tokenRes.data;

  // 2. Fetch user information using access_token
  let googleUser;
  try {
    const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    googleUser = userinfoRes.data;
  } catch (error) {
    console.error('Error fetching Google userinfo:', error.response?.data || error.message);
    throw new ApiError(400, 'Failed to fetch user profile from Google');
  }

  const { sub: googleId, email, name, picture } = googleUser;

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  };

  // Check state: is it "connect:userId"?
  if (state && state.startsWith('connect:')) {
    const userId = state.split(':')[1];
    
    // Check if another user is already linked to this googleId
    const existingGoogleUser = await User.findOne({ googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      return res.redirect('/settings?tab=security&error=Google account is already linked to another user');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.googleId = googleId;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.redirect('/settings?tab=security&connected=true');
  }

  // Normal login/signup flow
  // 1. Look up user by Google ID
  let user = await User.findOne({ googleId });

  // 2. If not found by Google ID, look up by Email (link accounts if email match)
  if (!user && email) {
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }
  }

  // 3. If still not found, register new Google user
  if (!user) {
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = emailPrefix;
    let usernameExists = await User.findOne({ username });
    let counter = 1;
    while (usernameExists) {
      username = `${emailPrefix}${counter}`;
      usernameExists = await User.findOne({ username });
      counter++;
    }

    user = await User.create({
      username,
      email,
      fullname: name || 'Google User',
      googleId,
      avatar: { url: picture || '', publicId: '' },
      isEmailVerified: true,
    });
  }

  // 4. Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, req);

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .redirect(`/login?token=${accessToken}&refreshToken=${refreshToken}`);
});

export const unlinkGoogle = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent lockout: must have a password to unlink Google
  if (!user.password) {
    throw new ApiError(400, 'Cannot disconnect Google account: you must set a password in the Password tab first.');
  }

  user.googleId = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, user, 'Google account successfully disconnected'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email address is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json(new ApiResponse(200, {}, 'If a matching account exists, a password reset link has been dispatched.'));
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  const messageText = `You are receiving this email because you (or someone else) requested to reset the password for your ProFlow account.\n\n` +
    `Please click the link below, or copy and paste it into your browser to complete the process:\n\n` +
    `${resetLink}\n\n` +
    `This link will expire in 15 minutes.\n\n` +
    `If you did not request this, please ignore this email and your password will remain unchanged.\n`;

  const messageHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">ProFlow Password Reset</h2>
      <p>You requested a password reset for your ProFlow account. Click the button below to reset your password:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 12px;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8;">If the button above does not work, copy and paste this URL into your browser:</p>
      <p style="font-size: 11px; color: #6366f1; word-break: break-all;">${resetLink}</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'ProFlow Password Reset Request',
    text: messageText,
    html: messageHtml,
  });

  return res.status(200).json(new ApiResponse(200, {}, 'If a matching account exists, a password reset link has been dispatched.'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(400, 'Reset token is required');
  }

  if (!password) {
    throw new ApiError(400, 'New password is required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password successfully updated. Please log in with your new credentials.'));
});
