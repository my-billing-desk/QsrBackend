const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists based on googleId
            let user = await User.findOne({ where: { googleId: profile.id } });

            if (!user) {
                // Check if user exists based on email
                const email = profile.emails[0].value;
                user = await User.findOne({ where: { email } });

                if (user) {
                    // Link googleId to existing user
                    user.googleId = profile.id;
                    await user.save();
                } else {
                    // Create new create
                    user = await User.create({
                        googleId: profile.id,
                        email: email,
                        displayName: profile.displayName,
                        role: 'admin', // Default Google users to Admin for Web Admin access
                        username: email.split('@')[0] // Fallback username
                    });
                }
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

// Serialize/Deserialize not strictly needed for JWT stateless, but Passport might ask
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findByPk(id);
    done(null, user);
});

module.exports = passport;
