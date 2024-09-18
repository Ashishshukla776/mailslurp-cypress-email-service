describe('Navigate the setting page and reorder pipeline', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/fms/pipelines?*').as("getPipeline");
        cy.login();
        cy.visit(`${Cypress.env("lmsUrl")}/setting/lead`);
    });

    afterEach(()=>{
        cy.signOut()
    })

    it('Reorder pipeline', () => {
        const movements = 1;

        cy.get("#app-routes p").contains("leads")
        cy.get('.MuiTypography-caption').contains("You can Create/ Rename/ Delete Pipeline for lead only.")
        cy.wait(1000)

        cy.get('.MuiPaper-root > :nth-child(2) > div > .MuiButtonBase-root').should("have.text", "Options").click()
        cy.get("#reorder").click()
        // get the pipeline-id using intercept and wait method
        cy.wait("@getPipeline").then(({ response }) => {
            let pipId = response.body.result.values.map(ele => ele.id)
            cy.get(`[data-rbd-draggable-id=${pipId[0]}]`).as('item');
            cy.get('@item').invoke('attr', 'data-rbd-drag-handle-draggable-id').as('item-id');

            cy.get('@item').invoke('attr', 'tabindex').as('item-index').should('equal', '0');

            // lift the element
            cy.get('@item').focus().trigger('keydown', { keyCode: 32 })
                .get('@item');  // need to re-query for a clone

            cy.wrap(Array.from({ length: movements })).each(() => {
                cy.get('@item').trigger('keydown', { keyCode: 40, force: true })
                    // finishing before the movement time is fine - but this looks nice
                    // waiting longer than we should (timings.outOfTheWay * 1000) as electron is being strange
                    .wait(1000);
            });

            // drop an element
            cy.get('@item').trigger('keydown', { keyCode: 32, force: true });

            cy.get('@item-id').then(() => {
                cy.get(`[data-rbd-draggable-id=${pipId[0]}]`).invoke('attr', 'tabindex')
            });

            cy.get('#cancel').should("have.text", "Cancel")
            cy.get("#save").click()
        })
    });
});