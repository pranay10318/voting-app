describe('Manage Questions', () => {
    before( () => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/');

        cy.get('#signup a').click();
        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', 'https://online-voting-app-oyt9.onrender.com/welcome');

        cy.visit('https://online-voting-app-oyt9.onrender.com/welcome');
        cy.get('a').contains('create a new election').click();
        cy.url().should('include', 'https://online-voting-app-oyt9.onrender.com/elections');
        cy.get('input[name="title"]').type('New Election Title');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', 'https://online-voting-app-oyt9.onrender.com/elections/');
        cy.visit('https://online-voting-app-oyt9.onrender.com/welcome');

        cy.get('#count-New-Elections').should('contain', '1');
    });

    it('should create a new question successfully', () => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/welcome');

        cy.get('#manage-election').click();
        cy.url().should('match', /https:\/\/online-voting-app-oyt9.onrender.com\/elections\/\d+/);
        cy.get('#manage-questions').click();
        cy.url().should('include', '/questions');

        cy.get('input[name="title"]').type('New Question Title');
        cy.get('input[name="description"]').type('New Question Description');
        cy.get('form').submit();

        cy.get("#manage-question").click();
        cy.contains('New Question Title').should('exist');
        cy.contains('New Question Description').should('exist');
    });

    it('should edit an existing question successfully', () => {
        // Login
        cy.visit('https://online-voting-app-oyt9.onrender.com/login');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();
    
        // Navigate to Manage Election page
        cy.get('#manage-election').click();
        cy.url().should('match', /https:\/\/online-voting-app-oyt9.onrender.com\/elections\/\d+/);    
        // Navigate to Manage Questions page
        cy.get('#manage-questions').click();
        cy.url().should('include', '/questions');
    
        // Click on the first question to view details
        cy.get('#manage-question').first().click();
        cy.url().should('include', '/questionsDetails');
    
        // Click on the edit button to go to edit page
        cy.get('#edit-question').click();
        cy.url().should('include', '/edit-question');
    
        // Edit the question title and description
        cy.get('input[name="title"]').clear().type('Edited Question Title');
        cy.get('input[name="desc"]').clear().type('Edited Question Description');
        cy.get('form').submit();
    
        // Verify the edited question is displayed
        cy.contains('Edited Question Title').should('exist');
        cy.contains('Edited Question Description').should('exist');
        
    });
    
    // it('should delete an existing question successfully', () => {
    //     cy.visit('https://online-voting-app-oyt9.onrender.com/login');
    //     cy.get('input[name="email"]').type('pranay1@gmail.com');
    //     cy.get('input[name="password"]').type('pwd');
    //     cy.get('button[type="submit"]').click();
        

    //     cy.get('#manage-election').click();
    //     cy.url().should('match', /https:\/\/online-voting-app-oyt9.onrender.com\/elections\/\d+/);
    //     cy.get('#manage-questions').click();
    //     cy.get('.delete-question').click();
    //     cy.url().should('include', '/questions');
    //     cy.get('input[name="title"]').type('Delete Question Title');
    //     cy.get('input[name="desc"]').type('New Question Description');
    //     cy.get('form').submit();
    //     cy.contains('Delete Question Title').should('exist');   
    //     cy.get('#delete-question').last().click();
    //     cy.contains('Deleted Question Title').should('not.exist');
    // });
    after(() => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/testDelete');
        cy.contains('Test delete done').should('exist');
    });
});
