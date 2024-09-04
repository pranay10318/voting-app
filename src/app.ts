// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
const csrf: any = require("tiny-csrf");
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
const path: any = require("path");
import passport from "passport";
import connectEnsureLogin from "connect-ensure-login";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
const bcrypt: any = require("bcrypt");
import flash from "connect-flash";
dotenv.config();

import { Sequelize } from "sequelize-typescript";
import { Admins } from "../models/Admins";
import Elections from "../models/Elections";
import Questions from "../models/Questions";
import Answers from "../models/Answers";
import { assert } from "console";
import Voters from "../models/Voters";
const config = require(".././config/config.json");
const env = process.env.NODE_ENV || "development";

let sequelize: Sequelize;
if(config[env].use_env_variable){
  const connectionString = process.env[config[env].use_env_variable];
  if (!connectionString) {
    throw new Error(`Environment variable ${config[env].use_env_variable} is not set`);
  }
  sequelize = new Sequelize(connectionString, config[env]);
}
else {
  const { database, username, password, host, port, dialect } = config[env];
  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect,
    logging: false
  });
}

sequelize.addModels([Admins, Elections, Questions, Answers, Voters]);

const app: Express = express();
// const port = 3000;
const saltRounds = 10;

app.use(bodyParser.json());

app.use(express.urlencoded({ extended: false })); //for encoding urls  form submission for maniputlating election

app.use(cookieParser("SSH! THIS IS A SCRET CODE"));
app.use(csrf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs"); //setting up engine to work with ejs
app.use(express.static("dist"));
// app.use(express.static('dist', {
//   setHeaders: (res: any, path: any) => {
//     if (path.endsWith('.css')) {
//       res.setHeader('Content-Type', 'text/css');
//     }
//   }
// }));

app.use(flash());
app.use(
  session({
    secret: "my-super-secret-keyq3243141234",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hrs
    },
  }),
);
app.use(function (request: any, response: any, next: any) {
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
      Admins.findOne({ where: { email: username } })
        .then(async function (user: any) {
          if (user) {
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, {
                //if password is not correct
                message: "Invalid Emailid or password",
              });
            }
          } else {
            return done(null, false, {
              //if Admin is not found
              message: "Invalid Emailid or password",
            });
          }
        })
        .catch((error: any) => {
          return done(null, false, { message: "Invalid Emailid or password" });
        });
    },
  ),
);

passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

passport.deserializeUser((id: any, done: any) => {
  Admins.findByPk(id)
    .then((user: any) => {
      done(null, user);
    })
    .catch((error: any) => {
      done(error, null);
    });
});
//passport part ,session creation end.

declare global {
  namespace Express {
    interface User {
      id?: string;
      firstName: string;
      email: string;
    }

    interface Request {
      user?: User; // user is now optional
      csrfToken(): string;
    }
  }
}

// all the setup is done now we can start with the routes...............................................

// Login, Signup and Signout .............................................

app.get("/signup", async (request: Request, response: Response) => {
  return response.render("signup", {
    title: "signup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", (request: Request, response: Response) => {
  //getting login page to webpage
  return response.render("login", {
    //we are rendering login.ejs
    title: "LogIn page",
    csrfToken: request.csrfToken(),
  });
});

// for signup
app.post("/admins", async function (request: Request, response: Response) {
  // const Admin = lazyAdminModel();

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

  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);

  var bl = await Admins.findOne({
    where: {
      email: request.body.email,
    },
  });

  if (bl != null) {
    request.flash("error", "Email already Exists");
    return response.redirect("/signup");
  }
  try {
    const admin = await Admins.create({
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
  function (request: Request, response: Response) {
    response.redirect("/welcome");
  },
);

app.get("/signout", (request, response, next) => {
  request.logOut((err) => {
    if (err) return next(err);
    response.redirect("/");
  });
});

// welcome routes .............................................

app.get("/", async (request: Request, response: Response) => {
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
  "/welcome",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Elections = lazyElectionsModel();
    // if(!request.user ) return;
    const loggedInadmin = request.user?.id; // Assuming 'id' property exists on 'User' type
    if (!loggedInadmin) throw new Error("Please login to continue");

    const allElections = await Elections.getElections(parseInt(loggedInadmin));
    const onGoingElections = await Elections.findAll({
      where: {
        adminId: loggedInadmin,
        started: true,
        status: false,
      },
    });
    console.log("onGoingElections : ", onGoingElections);
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
    console.log("newElections : ", newElections);
    if (request.accepts("html")) {
      console.log("request from web");
      console.log("data:", allElections, completedElections, newElections, onGoingElections);
      return response.render("welcome", {
        title: "My Elections",
        name: request.user?.firstName,
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
        name: request.user?.firstName,
        allElections,
        completedElections,
        newElections,
        onGoingElections,
        csrfToken: request.csrfToken(),
      });
    }
  },
);

// Elections.............................................

app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Elections = lazyElectionsModel();
    if (!request.user) throw new Error("User not found");
    const loggedInadmin = request.user.id;
    if (!loggedInadmin) throw new Error("Please login to continue");

    const allElections = await Elections.getElections(parseInt(loggedInadmin));
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
  },
);

app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request: Request, response: Response) {
    // const Elections = lazyElectionsModel();

    if (request.body.title.length == 0) {
      request.flash("error", "Enter the title");
      return response.redirect("/elections");
    }

    if (!request.user) return;
    if (!request.user.id) return;
    try {
      const res = await Elections.addElection({
        title: request.body.title,
        adminId: parseInt(request.user.id),
      });

      let createdElectionId = res.dataValues.id;
      let createdBy = res.dataValues.adminId;

      const loggedInadmin = request.user.id;
      assert(createdBy === loggedInadmin, "Admin id mismatch");

      return response.redirect(`/elections/${createdElectionId}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {

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
  },
);

app.delete(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request: Request, response: Response) {
    // const Elections = lazyElectionsModel();

    if (!request.user) throw new Error("User not found");
    if (!request.user.id) throw new Error("Please login to continue");

    try {
      var c = await Elections.deleteElection(
        parseInt(request.params.id),
        parseInt(request.user.id),
      );
      if (c) return response.json({ success: true });
      return response.json({ success: false });
    } catch (error) {
      return response.status(422).json(error);
    }
  },
);

//Questions.............................................
app.get(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Questions = lazyQuestionsModel();

    try {
      var questions = await Questions.findAll({
        where: {
          electionId: request.params.id,
        },
      });
      // here we need to add options too   but as of now not needed
      const res = {
        electionId: request.params.id,
        questions: questions,
        title: "Your Questions..!",
        email: request.user?.email,
        csrfToken: request.csrfToken(),
      };
      if (request.accepts("html"))
        return response.render("questions", res);
      return response.json(res);

    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.post(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Questions = lazyQuestionsModel();
    // const Elections = lazyElectionsModel();

    if (request.body.title.length == 0) {
      request.flash("error", "Enter the title");
      return response.redirect(`/elections/${request.params.id}/questions`);
    }
    if (request.body.description.length == 0) {
      request.flash("error", "You've entered a short description");
      return response.redirect(`/elections/${request.params.id}/questions`);
    }
    try {
      await Questions.addQuestion({
        title: request.body.title,
        description: request.body.description,
        electionId: parseInt(request.params.id),
      });
      const loggedInadmin = request.user?.id;
      const allElections = await Elections.findOne({
        where: {
          adminId: loggedInadmin,
        },
        order: [["id", "DESC"]],
      });

      return response.redirect(`/elections/${request.params.id}/questions`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.get(
  "/questionsDetails/:id/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Questions = lazyQuestionsModel();
    // const Answers = lazyAnswersModel();

    try {
      const question = await Questions.findByPk(parseInt(request.params.id));
      const answers = await Answers.getAnswers(parseInt(request.params.id));
      const res = {
        title: "Manage Questions",
        question,
        electionId: request.params.eid,
        questionId: request.params.id,
        answers,
        csrfToken: request.csrfToken(),
      };
      if(request.accepts("html"))
        return response.render("manageQuestion", res);
      return response.json(res);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.get(
  "/edit-question/:id/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // const Questions = lazyQuestionsModel();

    const questionId = request.params.id;
    const question = await Questions.findOne({
      where: {
        id: questionId,
      },
    });
    const res = {
      title: "Edit-Election",
      question,
      questionId,
      electionId: request.params.eid,
      csrfToken: request.csrfToken(),
    };

    if(request.accepts("html"))
      return response.render("edit-question", res);
    return response.json(res);
  },
);

app.post(
  "/edit-question/:id/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // const Questions = lazyQuestionsModel();

    const title = request.body.title;
    const desc = request.body.desc;
    const question = await Questions.findOne({
      where: {
        id: request.params.id,
      },
    });

    if (question?.title == title && question?.description == desc) {
      request.flash("error", "Please update the values..");
      return response.redirect(
        `/edit-question/${request.params.id}/${request.params.eid}`,
      );
    }
    const up = await Questions.update(
      {
        title,
        description: desc,
      },
      {
        where: {
          id: question?.id,
        },
      },
    );
    return response.redirect(
      `/questionsDetails/${question?.id}/${request.params.eid}`,
    );
  },
);

app.delete(
  "/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    // const Questions = lazyQuestionsModel();

    try {
      var c = await Questions.deleteQuestion({
        id: parseInt(request.params.id),
        electionId: request.body.electionId,
      });
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  },
);

// Answers.............................................
app.post(
  "/questions/:qid/answer/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Answers = lazyAnswersModel();

    var c = await Answers.count({
      where: {
        questionId: request.params.qid,
      },
    });
    if (c == 4) {
      request.flash("error", "Only 4 options are allowed for a question..!");
      return response.redirect(
        `/questionsDetails/${request.params.qid}/${request.params.eid}`,
      );
    }
    if (request.body.title.length == 0) {
      request.flash("error", "Please enter the answer..!");
      return response.redirect(
        `/questionsDetails/${request.params.qid}/${request.params.eid}`,
      );
    }
    try {
      let res = await Answers.addAnswer({
        title: request.body.title,
        questionId: parseInt(request.params.qid),
      });


      return response.redirect(
        `/questionsDetails/${request.params.qid}/${request.params.eid}`,
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.get(
  "/edit-answer/:id/:qid/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // const Answers = lazyAnswersModel();

    const answerId = request.params.id;
    const answer = await Answers.findOne({
      where: {
        id: answerId,
      },
    });
    return response.render("edit-answer", {
      title: "Edit-Answer",
      answer,
      answerId: answer?.id,
      electionId: request.params.eid,
      questionId: request.params.qid,
      csrfToken: request.csrfToken(),
    });
  },
);

app.post(
  "/edit-answer/:id/:qid/:eid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // const Answers = lazyAnswersModel();

    const title = request.body.title;
    const answer = await Answers.findOne({
      where: {
        id: request.params.id,
      },
    });

    if (answer?.title == title) {
      request.flash("error", "Please update the values..");
      return response.redirect(
        `/edit-answer/${request.params.id}/${request.params.qid}/${request.params.eid}`,
      );
    }
    const updateResponse = await Answers.update(
      {
        title,
      },
      {
        where: {
          id: answer?.id,
        },
      },
    );
    return response.redirect(
      `/questionsDetails/${request.params.qid}/${request.params.eid}`,
    );
  },
);

app.delete(
  "/answers/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    // const Answers = lazyAnswersModel();

    try {
      var c = await Answers.deleteAnswer({
        id: parseInt(request.params.id),
        questionId: request.body.questionId,
      });
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  },
);

// Voters.............................................
app.get(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Voters = lazyVotersModel();

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
        email: request.user?.email,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  },
);

app.post(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Voters = lazyVotersModel();
    // const Elections = lazyElectionsModel();

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
        electionId: parseInt(request.params.id),
      });
      
      return response.redirect(`/elections/${request.params.id}/voters`);
    } catch (error) {

      return response.status(422).json(error);
    }
  },
);

app.get(
  "/elections/:id/launch",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Elections = lazyElectionsModel();
    // const Questions = lazyQuestionsModel();
    // const Answers = lazyAnswersModel();
    // const Voters = lazyVotersModel();

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
          "election cannot be launched without minimum number of questions",
        );
        return response.redirect(`/elections/${id}`);
      } else if (votersCount == 0) {
        request.flash(
          "error",
          "election cannot be launched without minimum number of voters",
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
              "election cannot be launched please make sure every question has two or more options",
            );
            return response.redirect(`/elections/${id}`);
          }
        }

        if (flag == 0) {
          const ress = await Elections.startElection(parseInt(id));
          if (ress) {
            request.flash(
              "error",
              `election launched succesfully at  https://online-voting-app-oyt9.onrender.com/voter-login/${election?.id}/${election?.name}`,
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
  },
);


app.get(
  "/voter-login/:id/:election",
  async (request: Request, response: Response) => {
    // const Elections = lazyElectionsModel();

    const id = request.params.id;
    const election = await Elections.findByPk(id);
    return response.render("voter-login", {
      title: "Voter LogIn",
      election,
      csrfToken: request.csrfToken(),
    });
  },
);

app.post(
  "/voter-login/:id/:election",
  async (request: Request, response: Response) => {
    // const Voters = lazyVotersModel();

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
        `/voter-login/${request.params.id}/${request.params.election}`,
      );
    }
    if (voter.status === true) {
      request.flash("error", "your response was already submitted..");
      return response.redirect(
        `/voter-login/${request.params.id}/${request.params.election}`,
      );
    }
    return response.redirect(
      `/conduct-election/${request.params.id}/${request.params.election}/${voter.id}`,
    );
  },
);


app.get(
  "/conduct-election/:id/:election/:vid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Elections = lazyElectionsModel();
    // const Questions = lazyQuestionsModel();
    // const Answers = lazyAnswersModel();
    // const Voters = lazyVotersModel();

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
      if (parseInt(request.params.vid) == 0) {
        return response.render("ViewElection", {
          title: election?.name,
          electionId: id,
          election,
          voterId: request.params.vid,
          answers,
          questions,
          csrfToken: request.csrfToken(),
        });
      } else if (voter?.status == true) {
        request.flash("error", "your response was already submitted..");
        return response.redirect(
          `/voter-login/${request.params.id}/${request.params.election}`,
        );
      }
      return response.render("launch", {
        title: election?.name,
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
  },
);

app.get(
  "/elections/:id/preview",
  connectEnsureLogin.ensureLoggedIn(),
  async (request: Request, response: Response) => {
    // const Elections = lazyElectionsModel();
    // const Questions = lazyQuestionsModel();
    // const Answers = lazyAnswersModel();

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
  },
);

app.delete(
  "/voters/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    // const Voters = lazyVotersModel();

    try {
      //this electionid comes from del func in script of voters.ejs
      var c = await Voters.deleteVoter({
        id: parseInt(request.params.id),
        electionId: request.body.electionId,
      });
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  },
);

app.get("/testDelete", async (request: Request, response: Response) => {
    if(env == "development") {
      response.send("sORRY!!! Test delete is only available");
      return;
    }
    else {
      let res1 = await Elections.destroy({
        where: {
        },
      });
      let res2 = await Admins.destroy({
        where: {
        },
      });
      response.send("Test delete done");
    }
});

app.get("/test-diff-coverage", ()=>{
  let a = 10;
  let b = 20;
  let c = a+b;
  console.log(c);
});


export default app;
