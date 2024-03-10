describe('Login Test', () => {
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
  it('should login with valid credentials', () => {
      cy.visit('https://online-voting-app-oyt9.onrender.com/login');

      cy.get('input[name="email"]').type('pranay1@gmail.com'); // Provide a valid email
      cy.get('input[name="password"]').type('pwd'); // Provide a valid password
      cy.get('button[type="submit"]').click();

      cy.url().should('include', 'https://online-voting-app-oyt9.onrender.com/welcome');
  });

  it('should display an error if email is not provided', () => {
      cy.visit('https://online-voting-app-oyt9.onrender.com/login');

      cy.get('input[name="password"]').type('pwd'); // Provide a valid password
      cy.get('button[type="submit"]').click();

      cy.contains('Missing credentials').should('be.visible');
  });

  it('should display an error if password is not provided', () => {
      cy.visit('https://online-voting-app-oyt9.onrender.com/login');

      cy.get('input[name="email"]').type('pranay1@gmail.com'); // Provide a valid email
      cy.get('button[type="submit"]').click();

      cy.contains('Missing credentials').should('be.visible');
  });

  it('should display an error if email or password is incorrect', () => {
      cy.visit('https://online-voting-app-oyt9.onrender.com/login');

      cy.get('input[name="email"]').type('incorrectemail@gmail.com'); // Provide an incorrect email
      cy.get('input[name="password"]').type('incorrectpassword'); // Provide an incorrect password
      cy.get('button[type="submit"]').click();

      cy.contains('Invalid Emailid or password').should('be.visible');
  });

  it('should navigate to signup page when clicking "Sign-up" link', () => {
    cy.visit('https://online-voting-app-oyt9.onrender.com/login');

    cy.contains("Sign-up").click();
    cy.url().should('include', 'https://online-voting-app-oyt9.onrender.com/signup');
});
after(() => {
    cy.visit('https://online-voting-app-oyt9.onrender.com/testDelete');
    cy.contains('Test delete done').should('exist');
});
});
