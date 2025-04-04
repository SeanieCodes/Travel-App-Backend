const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            return done(null, user);
          }
          
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            user.googleId = profile.id;
            user.profilePicture = profile.photos[0].value;
            await user.save();
            return done(null, user);
          }
          
          const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            displayName: profile.displayName,
            username: `user_${profile.id.substring(0, 8)}`,
            profilePicture: profile.photos[0].value
          });
          
          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          console.error('Error in Google strategy:', error);
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};