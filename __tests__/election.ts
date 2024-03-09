import request from 'supertest';
import cheerio from 'cheerio';
import app from '../src/app';
import { Admins } from '../models/Admins';
import Elections from '../models/Elections';
import Questions from '../models/Questions';
import Answers from '../models/Answers';
import Voters from '../models/Voters';
import { Sequelize } from 'sequelize-typescript';
const config = require(".././config/config.json");
const env = process.env.NODE_ENV || "development";
const { database, username, password, host, port, dialect } = config[env];

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect,
  logging:false
});
sequelize.addModels([Admins, Elections, Questions, Answers, Voters]);


let server: any, agent: any;

function extractCsrfToken(res: any): string {
  const $ = cheerio.load(res.text);
  const csrfToken = $("[name=_csrf]").val();
  if (Array.isArray(csrfToken)) {
    return csrfToken[0];
  }
  return csrfToken!;
}

const login = async (username: string, password: string) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

const signout = async () => {
  let res = await agent.get("/signout");
}


beforeAll(async () => {
  await sequelize.sync({ force: true });
  server = app.listen(5000, () => {});
  agent = request.agent(server);

});
afterAll(async () => {
  try {
    await sequelize.close();
    await server.close();
  } catch (error) {
    console.log(error);
  }
});

describe("Voting Application Login SignUp", function () {

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/admins").send({
      firstName: "Test",
      lastName: "User A",
      email: "n@n.in",
      password: "123",
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/welcome");
    expect(res.headers["set-cookie"]).toBeDefined();
    await signout();
  });

  test("Sign out", async () => {
    await login("n@n.in", "123");
    let res = await agent.get("/welcome");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/welcome");
    expect(res.statusCode).toBe(302);
  });

  test("Login", async () => {
    await login("n@n.in", "123");
    let res = await agent.get("/welcome");
    expect(res.statusCode).toBe(200);
    await signout();
  });

  test("Sign up with existing email", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    //signup with existing email
    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/admins").send({
      firstName: "Test",
      lastName: "User B",
      email: "n@n.in", 
      password: "123",
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/signup");
    await signout();
  });

  test("Login with incorrect password", async () => {
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: "n@n.in",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/login");
    await signout();
  }
  );

  test("Login with incorrect email", async () => {
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: "user@gmail.com",
      password: "123",
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/login");
    await signout();
  });
});

describe("Election", function () {
    test("Create Election", async () => {
      await login("n@n.in", "123");
      let res = await agent.get("/elections");
      const csrfToken = extractCsrfToken(res);
      res = await agent.post("/elections").send({
        title: "Election 1",
        description: "Election 1 Description",
        _csrf: csrfToken,
      });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("/elections/1");// id would be 1 as it is the first election
    });

    test("View Election", async () => {
      let res = await agent.get("/elections");
      expect(res.statusCode).toBe(200);
    });


    test("Delete Election", async () => {

      let res = await agent.get("/elections");
      res = await agent.delete("/elections/1").send({
        _csrf: extractCsrfToken(res),
      });
      
      expect(res.statusCode).toBe(200);

      let txt = res.text;
      txt = await JSON.parse(txt);
      expect(txt.success).toBe(true);
    });

    test("Create Election with empty title", async () => {
      let res = await agent.get("/elections");
      const csrfToken = extractCsrfToken(res);
      res = await agent.post("/elections").send({
        title: "",
        description: "Election 1 Description",
        _csrf: csrfToken,
      });
      expect(res.ok).toBe(false);
    });

    test("Create Election with empty description", async () => {
      let res = await agent.get("/elections");
      const csrfToken = extractCsrfToken(res);
      res = await agent.post("/elections").send({
        title: "Election 1",
        description: "",
        _csrf: csrfToken,
      });

      expect(res.ok).toBe(false);
    });

  });


  describe("Testing Questions", () => {

  // Test for POST /elections/:id/questions
  test("Should add a new question for a specific election", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const csrfToken = await extractCsrfToken(
      await agent.get(`/elections/${election.id}/questions`)
    );

    const questionData = {
      title: 'Test Question',
      description: 'Test Question Description'
    };

    await agent
      .post(`/elections/${election.id}/questions`)
      .send({ _csrf: csrfToken, ...questionData })
      .expect(302);

    const questions = await Questions.findAll({
      where: { electionId: election.id }
    });

    expect(questions.length).toBe(1);
    expect(questions[0].title).toBe(questionData.title);
    expect(questions[0].description).toBe(questionData.description);
  });
  
  // Test for GET /elections/:id/questions
  test("Should retrieve questions for a specific election", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
      
    const response = await agent
      .get(`/elections/${election.id}/questions`)
      .set('Accept', 'application/json')
      .expect(200);
    
    const questions = response.body.questions;
    expect(questions.length).toBe(0);

    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });

    expect(questions.length).toBe(0);

  });
  
  // Test for GET /questionsDetails/:id/:eid
  test("Should retrieve details of a specific question", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });

    const response = await agent
      .get(`/questionsDetails/${question.id}/${election.id}`)
      .expect(200);
  });

  // Test for GET /edit-question/:id/:eid
  test("Should retrieve the edit page for a specific question", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });

    const response = await agent
      .get(`/edit-question/${question.id}/${election.id}`)
      .expect(200);
  });

  // Test for POST /edit-question/:id/:eid
  test("Should edit a specific question", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });

    const updatedTitle = 'Updated Test Question';
    const updatedDescription = 'Updated Test Question Description';

    const csrfToken = await extractCsrfToken(
      await agent.get(`/edit-question/${question.id}/${election.id}`)
    );

    await agent
      .post(`/edit-question/${question.id}/${election.id}`)
      .send({
        _csrf: csrfToken,
        title: updatedTitle,
        desc: updatedDescription
      })
      .expect(302);

    const updatedQuestion: any = await Questions.findByPk(question.id);
    expect(updatedQuestion.title).toBe(updatedTitle);
    expect(updatedQuestion.description).toBe(updatedDescription);
  });

  // Test for DELETE /questions/:id
  test("Should delete a specific question", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });

    const csrfToken = await extractCsrfToken(
      await agent.get(`/elections/${election.id}/questions`)
    );

    await agent
      .delete(`/questions/${question.id}`)
      .send({ _csrf: csrfToken, electionId: election.id})
      .expect(200);

    const deletedQuestion = await Questions.findByPk(question.id);
    expect(deletedQuestion).toBeNull();
    await signout();
  });
});




describe("Test Answers", () => {

  test("Should add an answer to a question", async () => {
    let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);

    await login("n@n.in", "123");
 
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });    
    res = await agent.get("/login");
  csrfToken = extractCsrfToken(res);
    csrfToken = await extractCsrfToken(res);

    const response = await agent
      .post(`/questions/${question.id}/answer/${election.id}`)
      .send({ title: "Test Answer", _csrf: csrfToken})
      .expect(302); 
    expect(response.headers.location).toContain(`/questionsDetails/${question.id}/${election.id}`);
  });

  test("Should not add an answer if title is empty", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    const response = await agent
      .post(`/questions/${question.id}/answer/${election.id}`)
      .send({ title: "" , _csrf: csrfToken})
      .expect(302); 
    expect(response.headers.location).toContain(`/questionsDetails/${question.id}/${election.id}`);
    expect(response.ok).toBe(false);
  });


  test("Should render the edit answer page", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });
    const answer = await Answers.create({ title: 'Test Answer', questionId: question.id});
    let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
    const response = await agent
      .get(`/edit-answer/${answer.id}/${question.id}/${election.id}`)
      .send({ _csrf: csrfToken})
      .expect(200);

    expect(response.text).toContain("Edit-Answer");
    expect(response.text).toContain(answer.title);
  });

  test("Should update an answer", async () => {

    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });
    const answer = await Answers.create({ title: 'Test Answer', questionId: question.id});
    let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
    const updatedTitle = "Updated Answer";
    const response = await agent
      .post(`/edit-answer/${answer.id}/${question.id}/${election.id}`)
      .send({ title: updatedTitle, _csrf: csrfToken})
      .expect(302); 

    expect(response.headers.location).toContain(`/questionsDetails/${question.id}/${election.id}`);

    const updatedAnswer: any = await Answers.findByPk(answer.id);
    expect(updatedAnswer.title).toBe(updatedTitle);
  });

  test("Should delete an answer", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({
      title: 'Test Question',
      description: 'Test Question Description',
      electionId: election.id
    });
    const answer = await Answers.create({ title: 'Test Answer', questionId: question.id});
    await login("n@n.in", "123");
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    const response = await agent
      .delete(`/answers/${answer.id}`)
      .send({ _csrf: csrfToken, questionId: question.id, electionId: election.id})
      .expect(200);
    expect(response.body.success).toBe(true);

    const deletedAnswer = await Answers.findByPk(answer.id);
    expect(deletedAnswer).toBeNull();
  });
});


describe("Voting Routes", () => {
  let csrfToken: string;
  // Test for GET /elections/:id/voters
  test("Should render the voters page for a specific election", async () => {
    const electionId = 1; 
    csrfToken = extractCsrfToken(await agent.get(`/elections/${electionId}/voters`));
    const res = await agent
      .get(`/elections/${electionId}/voters`)
      .send({ _csrf: csrfToken })
      .expect(200);
    expect(res.ok).toBe(true);
  });

  // Test for POST /elections/:id/voters
  test("Should add a new voter to a specific election", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    csrfToken = extractCsrfToken(await agent.get("/elections/1/voters"));
    const res = await agent
      .post(`/elections/${election.id}/voters`)
      .send({ name: "Test Voter", password: "123456", _csrf: csrfToken }) 
      .expect(302);
    
    expect(res.headers.location).toContain(`/elections/${election.id}/voters`);
  });

  // Test for GET /elections/:id/launch
  test("Should launch an election", async () => {
    const electionId = 1; 
    csrfToken = extractCsrfToken(await agent.get("/login"));
    const res = await agent
      .get(`/elections/${electionId}/launch`)
      .send({ _csrf: csrfToken }) 
      .expect(302);
    
    expect(res.headers.location).toContain(`/elections/${electionId}`);
  });

  // Test for GET /voter-login/:id/:election
  test("Should render the voter login page", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    csrfToken = extractCsrfToken(await agent.get("/login"));
    const res = await agent
      .get(`/voter-login/${election.id}/test-election`)
      .send({ _csrf: csrfToken })
      .expect(200);
  });

  // Test for POST /voter-login/:id/:election, 
  // TODO: dont allow when we dont have minimum values to launch
  test("Should log in a voter", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const voter = await Voters.create({ name: 'testvoter', password: "123456", electionId: election.id });

    csrfToken = extractCsrfToken(await agent.get("/login"));
    const res = await agent
      .post(`/voter-login/${election.id}/test-election`)
      .send({ id: "testvoter", password: "123456", _csrf: csrfToken }) 
      .expect(302); 
    
    
    expect(res.headers.location).toBe(`/conduct-election/${election.id}/test-election/${voter.id}`);
  });

  // Test for GET /conduct-election/:id/:election/:vid
  test("Should conduct an election", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const question = await Questions.create({ title: 'Test Question', description: 'Test Question Description', electionId: election.id });
    const option1 = await Answers.create({ title: 'Option 1', questionId: question.id });
    const option2 = await Answers.create({ title: 'Option 2', questionId: question.id });
    const voter1 = await Voters.create({ name: 'Test Voter', password: "123456", electionId: election.id });
    const voter2 = await Voters.create({ name: 'Test Voter 2', password: "123456", electionId: election.id });
    
    csrfToken = extractCsrfToken(await agent.get("/login"));
    const res = await agent
      .get(`/conduct-election/${election.id}/test-election/${voter1.id}`)
      .send({ _csrf: csrfToken })
      .expect(200);
  });

  // Test for DELETE /voters/:id
  test("Should delete a voter", async () => {
    const election = await Elections.addElection({ title: 'Test Election', adminId: 1 });
    const voter = await Voters.create({ name: 'Test Voter', password: "123456", electionId: election.id }); 
    csrfToken = extractCsrfToken(await agent.get("/login"));

    const res = await agent
      .delete(`/voters/${voter.id}`)
      .send({ electionId: election.id, _csrf: csrfToken }) 
      .expect(200);

    let txt = res.text;
    txt = await JSON.parse(txt);
    expect(txt.success).toBe(true);
  });
});
