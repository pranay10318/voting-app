describe('Answer Management', () => {
    before( () => {
        cy.visit('http://localhost:3000/');

        cy.get('#signup a').click();
        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', 'http://localhost:3000/welcome');
        
        cy.visit('http://localhost:3000/welcome');
        cy.get('a').contains('create a new election').click();
        cy.url().should('include', 'http://localhost:3000/elections');
        cy.get('input[name="title"]').type('New Election Title');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', 'http://localhost:3000/elections/');
        cy.visit('http://localhost:3000/welcome');

        cy.get('#count-New-Elections').should('contain', '1');
    });

    it('should create a question in an election and add one answer', () => {
      cy.visit('http://localhost:3000/welcome');
  
      // Navigate to Manage Election page
      cy.get('#manage-election').click();
      cy.url().should('match', /http:\/\/localhost:3000\/elections\/\d+/);
  
      // Navigate to Manage Questions page
      cy.get('#manage-questions').click();
      cy.url().should('include', '/questions');
  
      // Add a new question
      cy.get('input[name="title"]').type('New Question Title');
      cy.get('input[name="description"]').type('New Question Description');
      cy.get('form').submit();

      // Click on the first question to view details
      cy.get('#manage-question').first().click();
      cy.url().should('include', '/questionsDetails');

      cy.contains('New Question Title').should('exist');
      cy.contains('New Question Description').should('exist');
  
      // Add an answer to the question
      cy.get('#add-answer').click();
      cy.get('input[name="title"]').type('New Answer Title');
      cy.get('form').submit();
      cy.contains('New Answer Title').should('exist');
    });
  
    it('should edit an existing answer successfully', () => {
      cy.visit('http://localhost:3000/login');
      cy.get('input[name="email"]').type('pranay1@gmail.com');
      cy.get('input[name="password"]').type('pwd');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', 'http://localhost:3000/welcome');
  
      // Navigate to Manage Election page
      cy.get('#manage-election').click();
      cy.url().should('match', /http:\/\/localhost:3000\/elections\/\d+/);
  
      // Navigate to Manage Questions page
      cy.get('#manage-questions').click();
      cy.url().should('include', '/questions');
  
      // Click on the first question to view details
      cy.get('#manage-question').first().click();
      cy.url().should('include', '/questionsDetails');
  
      // Click on the edit button of an answer
      cy.get('#edit-answer').first().click();
      cy.url().should('include', '/edit-answer');
  
      // Edit the answer title
      cy.get('input[name="title"]').clear().type('Edited Answer Title');
      cy.get('form').submit();
      cy.contains('Edited Answer Title').should('exist');
    });
  
    it('should delete an existing answer successfully', () => {
      cy.visit('http://localhost:3000/login');
      cy.get('input[name="email"]').type('pranay1@gmail.com');
      cy.get('input[name="password"]').type('pwd');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', 'http://localhost:3000/welcome');
  
      // Navigate to Manage Election page
      cy.get('#manage-election').click();
      cy.url().should('match', /http:\/\/localhost:3000\/elections\/\d+/);
  
      // Navigate to Manage Questions page
      cy.get('#manage-questions').click();
      cy.url().should('include', '/questions');
  
      // Click on the first question to view details
      cy.get('#manage-question').first().click();
      cy.url().should('include', '/questionsDetails');
  
      // Delete an answer
      cy.get('.delete-answer').first().click();
      cy.contains('Deleted Answer Title').should('not.exist');
    });
    after(() => {
        cy.visit('http://localhost:3000/testDelete');
        cy.contains('Test delete done').should('exist');
    });
  });
  