/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const {
  Elections,
  Admin,
  Questions,
  Answers,
  Voters,
} = require("./models"); //for doing any operations on election we should import models
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
app.use(express.urlencoded({ extended: false })); //for encoding urls  form submission for maniputlating election

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
  var bul = false;
  if (request.user) {
    bul = true;
  }
  return response.render("index", {
    title: "online Voting Application",
    loginStatus: bul,
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInadmin = request.user.id;
    const allElections = await Elections.getElections(loggedInadmin);
    const onGoingElections = await Elections.findAll({
      where: {
        adminId: loggedInadmin,
        started: true,
        status: false,
      },
    });
    const completedElections = await Elections.findAll({
      where: {
        adminId: loggedInadmin,
        started: true,
        status: true,
      },
    });
    const newElections = await Elections.findAll({
      where: {
        adminId: loggedInadmin,
        started: false,
        status: false,
      },
    });

    if (request.accepts("html")) {
      //request from web i.e. it accepts html   but for postman it accepts json that is in else part
      return response.render("elections", {
        //new elections.ejs should be created
        title: "my Elections",
        email: request.user.email,
        allElections,
        completedElections,
        newElections,
        onGoingElections,
        csrfToken: request.csrfToken(),
      });
    } else {
      //for postman like api  we should get json format as it donot support html
      return response.json({
        title: "my Elections",
        email: request.user.email,
        allElections,
        completedElections,
        newElections,
        onGoingElections,
        csrfToken: request.csrfToken(),
      });
    }
  }
);
app.get(
  "/welcome",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInadmin = request.user.id;
    const allElections = await Elections.getElections(loggedInadmin);
    const onGoingElections = await Elections.findAll({
      where: {
        adminId: loggedInadmin,
        started: true,
        status: false,
      },
    });
    const completedElections = await Elections.findAll({
      where: {
        adminId: loggedInadmin,
        started: true,
        status: true,
      },
    });
    const newElections = await Elections.findAll({
      where: {
        adminId: loggedInadmin,
        started: false,
        status: false,
      },
    });
    if (request.accepts("html")) {
      return response.render("welcome", {
        title: "My Elections",
        name: request.user.firstName,
        allElections,
        completedElections,
        newElections,
        onGoingElections,
        csrfToken: request.csrfToken(),
      });
    } else {
      //for postman like api  we should get json format as it donot support html
      return response.json({
        title: "My Elections",
        name: request.user.firstName,
        allElections,
        completedElections,
        newElections,
        onGoingElections,
        csrfToken: request.csrfToken(),
      });
    }
  }
);

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
  var bl = await Admin.findOne({
    where: {
      email: request.body.email,
    },
  });
  if (bl != null) {
    request.flash("error", "Email already Exists");
    return response.redirect("/signup");
  }
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
        return response.redirect("/welcome");
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

    console.log("creating new election", request.body);
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
      return response.render("election-create", {
        electionId: request.params.id,
        election,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/questionsDetails/:id/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    //async for getting req
    try {
      const question = await Questions.findByPk(request.params.id);
      const answers = await Answers.getAnswers(request.params.id);

      return response.render("manageQuestion", {
        title: "Manage Questions",
        question,
        electionId: request.params.eid,
        questionId: request.params.id,
        answers,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      var questions = await Questions.findAll({
        where: {
          electionId: request.params.id,
        },
      });
      // here we need to add options too   but as of now not needed
      return response.render("questions", {
        electionId: request.params.id,
        questions: questions,
        title: "Your Questions..!",
        email: request.user.email,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.post(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.title.length == 0) {
      request.flash("error", "Enter the title");
      return response.redirect(`/elections/${request.params.id}/questions`);
    }
    if (request.body.description.length == 0) {
      request.flash("error", "Enter a short description");
      return response.redirect(`/elections/${request.params.id}/questions`);
    }
    try {
      await Questions.addQuestion({
        title: request.body.title,
        description: request.body.description,
        electionId: request.params.id,
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

      return response.redirect(`/elections/${request.params.id}/questions`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/questions/:id/answer/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    var c = await Answers.count({
      where: {
        questionId: request.params.id,
      },
    });
    if (c == 4) {
      request.flash("error", "Only 4 options are allowed for a question..!");
      return response.redirect(
        `/questionsDetails/${request.params.id}/${request.params.eid}`
      );
    }
    if (request.body.title.length == 0) {
      request.flash("error", "Please enter the answer..!");
      return response.redirect(
        `/questionsDetails/${request.params.id}/${request.params.eid}`
      );
    }
    try {
      await Answers.addAnswer({
        title: request.body.title,
        questionId: request.params.id,
      });

      return response.redirect(
        `/questionsDetails/${request.params.id}/${request.params.eid}`
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
// app.get("/voters", connectEnsureLogin.ensureLoggedIn(), (request, response) => {
//   response.render("voters.ejs");
// });

app.get(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      var voters = await Voters.findAll({
        where: {
          electionId: request.params.id,
        },
      });
      // here we need to add options too   but as of now not needed
      return response.render("voters", {
        electionId: request.params.id,
        voters: voters,
        title: "Your voters..!",
        email: request.user.email,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.post(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.name.length == 0) {
      request.flash("error", "Enter name!!");
      return response.redirect(`/elections/${request.params.id}/voters`);
    }
    if (request.body.password.length == 0) {
      request.flash("error", "Enter access key!!");
      return response.redirect(`/elections/${request.params.id}/voters`);
    }
    try {
      await Voters.addVoter({
        title: request.body.name,
        password: request.body.password,
        electionId: request.params.id,
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

      return response.redirect(`/elections/${request.params.id}/voters`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/elections/:id/launch",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const id = request.params.id;
      const election = await Elections.findByPk(id);
      // here we need to add options too   but as of now not needed
      const questionsCount = await Questions.count({
        where: {
          electionId: id,
        },
      });
      const questions = await Questions.findAll({
        where: {
          electionId: id,
        },
      });
      const answers = await Answers.findAll();
      const votersCount = await Voters.count({
        where: {
          electionId: id,
        },
      });
      if (questionsCount == 0) {
        request.flash(
          "error",
          "election cannot be launched without minimum number of questions"
        );
        return response.redirect(`/elections/${id}`);
      } else if (votersCount == 0) {
        request.flash(
          "error",
          "election cannot be launched without minimum number of voters"
        );
        return response.redirect(`/elections/${id}`);
      } else {
        var flag = 0;
        for (var i = 0; i < questions.length; i++) {
          const cnt = await Answers.count({
            where: {
              questionId: questions[i].id,
            },
          });
          if (cnt < 2) {
            flag = 1;
            request.flash(
              "error",
              "election cannot be launched please make sure every question has two or more options"
            );
            return response.redirect(`/elections/${id}`);
          }
        }

        if (flag == 0) {
          const ress = await Elections.startElection(id);
          if (ress) {
            // return response.render("launch.ejs", {
            //   election,
            //   questions,
            //   answers,
            //   title: "Preview Election",
            //   csrfToken: request.csrfToken(),
            // });
            request.flash(
              "error",
              `election launched succesfully at  https://online-voting-app-oyt9.onrender.com/voter-login/${election.id}/${election.name}`
            );
            return response.redirect(`/elections/${id}`);
          }
        } else {
          request.flash("error", "launch cannot be done");
          return response.redirect(`/elections/${id}`);
        }
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get(
  "/elections/:id/end",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const id = request.params.id;
      const election = await Elections.findByPk(id);
      if (election.status == false) {
        const ress = Elections.update(
          { status: true },
          {
            where: {
              id,
            },
          }
        );
        if (ress) return response.redirect(`/welcome`);
        else {
          request.flash("error", "ending cannot be done");
          return response.redirect(`/welcome`);
        }
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/signup", (request, response) => {
  return response.render("signup", {
    title: "signup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", (request, response) => {
  //getting login page to webpage
  return response.render("login", {
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

app.get(
  "/elections/:id/editElection",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const election = await Elections.findByPk(request.params.id);
      return response.render("editElection", {
        title: "editElection",
        electionId: request.params.id,
        election,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/elections/:id/editElection",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    console.log("we have to update a election with ID:", request.params.id);
    try {
      const election = await Elections.findByPk({
        where: { id: request.params.id },
      });
      const updatedElection = await Elections.editElectionName(
        request.body.name, //this part we are passing in index.js body attribute
        loggedInUser
      );
      return response.json(updatedElection);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a election with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    try {
      //this code is by them i.e. wd   my code is below
      var c = await Elections.deleteElection(
        request.params.id,
        request.user.id
      );
      if (c) console.log("deleted successfully");
      else console.log("unsuccesss");
      if(c)
      return response.json({ success: true });
      return response.json({ success: false });

    } catch (error) {
      return response.status(422).json(error);
    }
  }
);
app.delete(
  "/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Question with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    try {
      //this code is by them i.e. wd   my code is below
      var c = await Questions.deleteQuestion({
        id: request.params.id,
        electionId: request.body.electionId,
      });
      if (c) console.log("deleted successfully");
      else console.log("unsuccesss");
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);
app.delete(
  "/answers/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a answer with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE
    try {
      //this code is by them i.e. wd   my code is below
      var c = await Answers.deleteAnswer({
        id: request.params.id,
        questionId: request.body.questionId,
      });
      if (c) console.log("deleted successfully");
      else console.log("unsuccesss");
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/voters/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a voter with ID: ", request.params.id);
    try {
      //this electionid comes from del func in script of voters.ejs
      var c = await Voters.deleteVoter({
        id: request.params.id,
        electionId: request.body.electionId,
      });
      if (c) console.log("deleted successfully");
      else console.log("unsuccesss");
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const elections = await Elections.findAll(request.params.id);
      return response.render("list", {
        title: "view Election",
        electionId: request.params.id,
        elections,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get("/voter-login/:id/:election", async (request, response) => {
  const id = request.params.id;
  const election = await Elections.findByPk(id);
  return response.render("voter-login", {
    title: "Voter LogIn",
    election,
    csrfToken: request.csrfToken(),
  });
});
app.post("/voter-login/:id/:election", async (request, response) => {
  const name = request.body.id;
  const password = request.body.password;
  const voter = await Voters.findOne({
    where: {
      name,
      password,
      electionId: request.params.id,
    },
  });

  if (!voter) {
    request.flash("error", "Invalid details..");
    return response.redirect(
      `/voter-login/${request.params.id}/${request.params.election}`
    );
  }
  console.log("statuasssssssssss.................", voter.status);
  if (voter.status === true) {
    request.flash("error", "your response was already submitted..");
    return response.redirect(
      `/voter-login/${request.params.id}/${request.params.election}`
    );
  }
  return response.redirect(
    `/conduct-election/${request.params.id}/${request.params.election}/${voter.id}`
  );
});

app.get("/conduct-election/:id/:election/:vid", async (request, response) => {
  const id = request.params.id;
  try {
    const questions = await Questions.findAll({
      where: {
        electionId: id,
      },
    });
    const voter = await Voters.findOne({
      where: {
        id: request.params.vid,
        electionId: request.params.id,
      },
    });
    const election = await Elections.findByPk(id);
    const answers = await Answers.findAll();
    if (request.params.vid == 0) {
      return response.render("ViewElection", {
        title: election.name,
        electionId: id,
        election,
        voterId: request.params.vid,
        answers,
        questions,
        csrfToken: request.csrfToken(),
      });
    } else if (voter.status == true) {
      request.flash("error", "your response was already submitted..");
      return response.redirect(
        `/voter-login/${request.params.id}/${request.params.election}`
      );
    }
    return response.render("launch", {
      title: election.name,
      electionId: id,
      election,
      voterId: request.params.vid,
      answers,
      questions,
      csrfToken: request.csrfToken(),
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
app.get(
  "/elections/:id/preview",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const id = request.params.id;
      const election = await Elections.findOne({
        where: {
          id,
        },
      });
      const questions = await Questions.findAll({
        where: {
          electionId: id,
        },
      });
      const answers = await Answers.findAll();
      console.log("asdf..............................." + answers);
      return response.render("ViewElection", {
        election,
        questions,
        answers,
        title: "Preview Election",
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get("/result/:id", async (request, response) => {
  const ress = await Voters.update(
    { status: true },
    {
      where: {
        id: request.params.id,
      },
    }
  );
  return response.render("result");
});
app.get("/elections/:id/viewResults", async (request, response) => {
  return response.render("viewResults");
});
app.get(
  "/edit-answer/:id/:qid/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const answerId = request.params.id;
    const answer = await Answers.findOne({
      where: {
        id: answerId,
      },
    });
    return response.render("edit-answer", {
      title: "Edit-Answer",
      answer,
      answerId: answer.id,
      electionId: request.params.eid,
      questionId: request.params.qid,
      csrfToken: request.csrfToken(),
    });
  }
);
app.post(
  "/edit-answer/:id/:qid/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const title = request.body.title;
    const answer = await Answers.findOne({
      where: {
        id: request.params.id,
      },
    });

    if (answer.title == title) {
      request.flash("error", "Please update the values..");
      return response.redirect(
        `/edit-answer/${request.params.id}/${request.params.qid}/${request.params.eid}`
      );
    }
    const up = await Answers.update(
      {
        title,
      },
      {
        where: {
          id: answer.id,
        },
      }
    );
    console.log("asfddddddddddddddddd....................." + up);
    return response.redirect(
      `/questionsDetails/${request.params.qid}/${request.params.eid}`
    );
  }
);

app.get(
  "/edit-question/:id/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const questionId = request.params.id;
    const question = await Questions.findOne({
      where: {
        id: questionId,
      },
    });
    return response.render("edit-question", {
      title: "Edit-Election",
      question,
      questionId,
      electionId: request.params.eid,
      csrfToken: request.csrfToken(),
    });
  }
);
app.post(
  "/edit-question/:id/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const title = request.body.title;
    const desc = request.body.desc;
    const question = await Questions.findOne({
      where: {
        id: request.params.id,
      },
    });

    if (question.title == title && question.description == desc) {
      request.flash("error", "Please update the values..");
      return response.redirect(
        `/edit-question/${request.params.id}/${request.params.eid}`
      );
    }
    const up = await Questions.update(
      {
        title,
        description: desc,
      },
      {
        where: {
          id: question.id,
        },
      }
    );
    console.log("asfddddddddddddddddd....................." + up);
    return response.redirect(
      `/questionsDetails/${question.id}/${request.params.eid}`
    );
  }
);
module.exports = app;
