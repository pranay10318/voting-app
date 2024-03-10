
describe('Launch Election', () => {
    before( () => {
        cy.visit('http://localhost:3000/');

        cy.get('#signup a').click();
        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', 'http://localhost:3000/welcome');
    });

    it('should raise error when minimum requirements are not met', () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        // create a election
        cy.visit('http://localhost:3000/welcome');
        cy.get('a').contains('create a new election').click();
        cy.url().should('include', 'http://localhost:3000/elections');
        cy.get('input[name="title"]').type('New Election Title');
        cy.get('button[type="submit"]').click();

        // try to launch the election  without minimum questions and voters
        cy.visit('http://localhost:3000/welcome');
        cy.get('#manage-election').click();
        cy.url().should('include', 'http://localhost:3000/elections/');
        cy.contains('Manage Questions').should('exist');
        cy.contains('Manage Voters').should('exist');
        cy.contains('Launch Election').should('exist');

        cy.get('a').contains('Launch Election').click();
        cy.contains('election cannot be launched').should('exist');
    }  ); 

    it('should raise error when minimum voters are not added', () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.visit('http://localhost:3000/welcome');

        cy.get('#manage-election').click();
        cy.url().should('include', 'http://localhost:3000/elections/');
        cy.contains('Manage Questions').should('exist');
        cy.contains('Manage Voters').should('exist');
        cy.contains('Launch Election').should('exist');

        cy.get('#manage-questions').click();
        cy.url().should('include', '/questions');

        cy.get('input[name="title"]').type('New Question Title');
        cy.get('input[name="description"]').type('New Question Description');
        cy.get('form').submit();

        cy.get("#manage-question").click();
        cy.contains('New Question Title').should('exist');
        cy.contains('New Question Description').should('exist');

        //adding two options for this quesion
        cy.get('#add-answer').click();
        cy.get('input[name="title"]').type('New Answer Title1');
        cy.get('form').submit();
        cy.contains('New Answer Title1').should('exist');
        
        cy.get('#add-answer').click();
        cy.get('input[name="title"]').type('New Answer Title1');
        cy.get('form').submit();
        cy.contains('New Answer Title1').should('exist');

        cy.visit('http://localhost:3000/welcome');

        cy.get('#manage-election').click();
        cy.url().should('include', 'http://localhost:3000/elections/');
        cy.get('a').contains('Launch Election').click();

        cy.contains('election cannot be launched').should('exist');
    });

    it('should add voters successfully', () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.visit('http://localhost:3000/welcome');

        cy.get('#manage-election').click();

        cy.url().should('include', 'http://localhost:3000/elections/');
        cy.contains('Manage Questions').should('exist');
        cy.contains('Manage Voters').should('exist');
        cy.contains('Launch Election').should('exist');

        cy.contains('Manage Voters').click();
        // /elections/:id/voters
        cy.url().should('match', /http:\/\/localhost:3000\/elections\/\d+\/voters/);

        cy.get('input[name="name"]').type('New Voter Name1');
        cy.get('input[name="password"]').type('New Voter Password');
        cy.get('form').submit();

        cy.contains('New Voter Name1').should('exist');

        cy.get('input[name="name"]').type('New Voter Name2');
        cy.get('input[name="password"]').type('New Voter Password');
        cy.get('form').submit();

        cy.contains('New Voter Name2').should('exist');

    });






    it('should launch election successfully', () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.visit('http://localhost:3000/welcome');

        cy.get('#manage-election').click();
        cy.url().should('include', 'http://localhost:3000/elections/');
        cy.contains('Manage Questions').should('exist');
        cy.contains('Manage Voters').should('exist');
        cy.contains('Launch Election').should('exist');

        cy.get('a').contains('Launch Election').click();

        cy.contains('election launched succesfully at').should('exist');

    });
    after(() => {
        cy.visit('http://localhost:3000/testDelete');
        cy.contains('Test delete done').should('exist');
    });

});