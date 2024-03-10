describe('Elections Creation Test', () => {
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

    it('should create a new election successfully', () => {
        cy.visit('http://localhost:3000/welcome');
        cy.get('a').contains('create a new election').click();
        cy.url().should('include', 'http://localhost:3000/elections');
        cy.get('input[name="title"]').type('New Election Title');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', 'http://localhost:3000/elections/');
        cy.visit('http://localhost:3000/welcome');

        cy.get('#count-New-Elections').should('contain', '1');
    });

    it('should click on "Manage" and go to "Manage Election" page, redirect to URL with elections/:id, and contain expected texts', () => {
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
    });
    


    it('should display an error if the title is not provided', () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.visit('http://localhost:3000/welcome');

        cy.get('a').contains('create a new election').click();

        cy.url().should('include', 'http://localhost:3000/elections');

        cy.get('button[type="submit"]').click();

        cy.contains('Enter the title').should('be.visible');
    });
    after(() => {
        cy.visit('http://localhost:3000/testDelete');
        cy.contains('Test delete done').should('exist');
    });
});