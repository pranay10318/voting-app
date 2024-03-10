describe('Signup Test', () => {
    it('should sign up a new user successfully', () => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/');

        cy.get('#signup a').click();
        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', 'https://online-voting-app-oyt9.onrender.com/welcome');
    });

    it('should display an error if first name is not provided', () => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/signup');

        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.contains('First name Required').should('be.visible');
    });

    it('should display an error if email is not provided', () => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/signup');

        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.contains('Email Required').should('be.visible');
    });

    it('should display an error if password is not provided', () => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/signup');

        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('button[type="submit"]').click();

        cy.contains('Password Required').should('be.visible');
    });

    it('should display an error if email already exists', () => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/signup');

        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com'); // Provide an email that already exists in the database
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.contains('Email already Exists').should('be.visible');
    });

    it('should navigate to login page when clicking "login" link', () => {
        // Test for navigating to signup page when clicking "Don't have an account? Sign-up" link
        cy.visit('https://online-voting-app-oyt9.onrender.com/signup');

        cy.contains("Sign-in").click();
        cy.url().should('include', 'https://online-voting-app-oyt9.onrender.com/login');
    });
    after(() => {
        cy.visit('https://online-voting-app-oyt9.onrender.com/testDelete');
        cy.contains('Test delete done').should('exist');
    });

});
