import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
    //Gets the cookie from the user  this is possible bc app.use(cookieParser()); therefore it is advaiable as req.cookies
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Please Login First' })
    }

    try {
        //Uses the same secret to verify the token
        //JWT checks things like: Was this token actually signed with our secret? Has someone tampered with it? Has it expired?
        //If everything is valid, jwt.verify() gives you the payload you originally put into the token.
        //You originally created:
        // {userId: user.id }
        //So the payload might be:
        // { userId: 42, iat: 1234567890, exp: 1235172690 }
        //iat and exp are JWT-related timestamps.
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        //You are adding your own property to the request object
        //Remember, req is the request object that travels through your middleware.
        //You're essentially saying: "I verified this person. Their user ID is 42. I'm going to attach that information to the request so the next function can use it."
        req.userId = payload.userId;

        next();

    } catch (error) {
        res.status(401).json({ error: `Invalid or expired token ${error}` });
    }
}