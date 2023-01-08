/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const { Elections, Todo, Admin } = require("./models"); //for doing any operations on todo we should import models
const bodyParser = require("body-parser"); //for parsing from/to json
var cookieParser = require("cookie-parser");
const path = require("path");
// const Admin= require("./models/user");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const { getElementById } = require("domutils");

const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); //for encoding urls  form submission for maniputlating todo

app.use(cookieParser("SSH! THIS IS A SCRET CODE"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs"); //setting up engine to work with ejs
app.use(express.static(path.join(__dirname, "public")));

app.use(flash());
app.use(
  session({
    secret: "my-super-secret-keyq3243141234",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hrs
    },
  })
);
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, {
              //if password is not correct
              message: "Invalid Emailid or password",
            });
          }
        })
        .catch((error) => {
          //if Adminis not found
          return done(null, false, { message: "Invalid Emailid or password" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing Adminwith id ", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Admin.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});
//passport part ,session creation end.

app.get("/", async (request, response) => {
  response.render("index", {
    title: "Todo Application",
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInadmin = request.user.id;
    const allElections = await Elections.getElections(loggedInadmin);

    if (request.accepts("html")) {
      //request from web i.e. it accepts html   but for postman it accepts json that is in else part
      response.render("elections", {
        //new todos.ejs should be created
        title: "my Elections",
        email: request.user.email,
        allElections,
        csrfToken: request.csrfToken(),
      });
    } else {
      //for postman like api  we should get json format as it donot support html
      response.json({
        allElections,
      });
    }
  }
);
app.get("/welcome", async (request, response) => {
  const loggedInadmin = request.user.id;
  const allElections = await Elections.getElections(loggedInadmin);

  if (request.accepts("html")) {
    response.render("welcome", {
      title: "My Elections",
      name: request.user.firstName,
      allElections,
      csrfToken: request.csrfToken(),
    });
  } else {
    //for postman like api  we should get json format as it donot support html
    response.json({
      allElections,
    });
  }
});

app.post("/admins", async function (request, response) {
  if (request.body.firstName.length == 0) {
    request.flash("error", "First name Required");
    return response.redirect("/signup");
  } else if (request.body.email.length == 0) {
    request.flash("error", "Email Required");
    return response.redirect("/signup");
  } else if (request.body.password.length == 0) {
    request.flash("error", "Password Required");
    return response.redirect("/signup");
  }
  console.log("creating new User", request.body);
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const admin = await Admin.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(admin, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/welcome");
      } else {
        request.flash("success", "Successfully Signed up");
        response.redirect("/welcome");
      }
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "Email already Exists");
    return response.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/welcome");
  }
);

app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    if (request.body.title.length == 0) {
      request.flash("error", "Enter the title");
      return response.redirect("/elections");
    }

    console.log("creating new todo", request.body);
    try {
      await Elections.addElection({
        title: request.body.title,
        adminId: request.user.id,
      });
      console.log("dfadfadsfasd.................", request.body);
      const loggedInadmin = request.user.id;
      const allElections = await Elections.findOne({
        where: {
          adminId: loggedInadmin,
        },
        order: [["id", "DESC"]],
      });
      console.log("......................al id.......", allElections);

      return response.redirect(`/elections/${allElections.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    //async for getting req
    try {
      const election = await Elections.findByPk(request.params.id);
      response.render("election-create", {
        election,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/questions", (request, response) => {
  response.render("questions.ejs");
});

app.get("/voters", (request, response) => {
  response.render("voters.ejs");
});

app.get("/launch", (request, response) => {
  response.render("launch.ejs");
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "signup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", (request, response) => {
  //getting login page to webpage
  response.render("login", {
    //we are rendering login.ejs
    title: "LogIn page",
    csrfToken: request.csrfToken(),
  });
});

//signout of user
app.get("/signout", (request, response, next) => {
  //next handler
  request.logOut((err) => {
    if (err) return next(err);
    response.redirect("/");
  });
});

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    console.log("we have to update a todo with ID:", request.params.id);
    try {
      const todo = await Todo.findByPk(request.params.id);
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed, //this part we are passing in index.js body attribute
        loggedInUser
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    try {
      //this code is by them i.e. wd   my code is below
      await Todo.remove({
        id: request.params.id,
        userId: request.user.id,
      });
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
