Cypress.Commands.add("createInbox", () => {
    return mailslurp.createInbox();
});

Cypress.Commands.add("waitForLatestEmail", (inboxId) => {
    // how long we should hold connection waiting for an email to arrive
    const timeoutMillis = 60_000;
    return mailslurp.waitForLatestEmail(inboxId, timeoutMillis)
});