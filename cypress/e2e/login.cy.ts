describe('Login Test', () => {
    it('should sign up a new user successfully', () => {
        cy.visit('http://localhost:3000/');

        cy.get('#signup a').click();
        cy.get('input[name="firstName"]').type('pranay');
        cy.get('input[name="lastName"]').type('pranay');
        cy.get('input[name="email"]').type('pranay1@gmail.com');
        cy.get('input[name="password"]').type('pwd');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', 'http://localhost:3000/welcome');
    });
  it('should login with valid credentials', () => {
      cy.visit('http://localhost:3000/login');

      cy.get('input[name="email"]').type('pranay1@gmail.com'); // Provide a valid email
      cy.get('input[name="password"]').type('pwd'); // Provide a valid password
      cy.get('button[type="submit"]').click();

      cy.url().should('include', 'http://localhost:3000/welcome');
  });

  it('should display an error if email is not provided', () => {
      cy.visit('http://localhost:3000/login');

      cy.get('input[name="password"]').type('pwd'); // Provide a valid password
      cy.get('button[type="submit"]').click();

      cy.contains('Missing credentials').should('be.visible');
  });

  it('should display an error if password is not provided', () => {
      cy.visit('http://localhost:3000/login');

      cy.get('input[name="email"]').type('pranay1@gmail.com'); // Provide a valid email
      cy.get('button[type="submit"]').click();

      cy.contains('Missing credentials').should('be.visible');
  });

  it('should display an error if email or password is incorrect', () => {
      cy.visit('http://localhost:3000/login');

      cy.get('input[name="email"]').type('incorrectemail@gmail.com'); // Provide an incorrect email
      cy.get('input[name="password"]').type('incorrectpassword'); // Provide an incorrect password
      cy.get('button[type="submit"]').click();

      cy.contains('Invalid Emailid or password').should('be.visible');
  });

  it('should navigate to signup page when clicking "Sign-up" link', () => {
    cy.visit('http://localhost:3000/login');

    cy.contains("Sign-up").click();
    cy.url().should('include', 'http://localhost:3000/signup');
});
after(() => {
    cy.visit('http://localhost:3000/testDelete');
    cy.contains('Test delete done').should('exist');
});
});