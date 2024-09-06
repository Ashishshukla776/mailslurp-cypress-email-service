import util from '../../helper/utility';
import { requestBody } from '../../helper/request';
import { responseData } from '../../helper/response';
import { qsWithoutCatId } from '../../helper/queryParams';
import { route } from '../../helper/route';

describe(`Test case for Register new user`, () => {
    const { faker } = require('@faker-js/faker');
    let mailId;
    let email;
    let token;
    let set_cookie;

    const request = (setM, setUrl, setH, setQs, setBody, showTeststatus) => {
        return cy.request({
            method: setM,
            url: setUrl,
            headers: setH,
            qs: setQs,
            body: setBody,
            failOnStatusCode: showTeststatus
        });
    };

    const initBody = (payload, ignoredata = []) => {
        let reqData = {
            uid: payload.hasOwnProperty("uid") ? payload.uid : "",
            type: payload.hasOwnProperty("type") ? payload.type : "email",
            region: payload.hasOwnProperty("region") ? payload.region : "IN"
        };
        ignoredata.forEach((itemrow) => {
            delete reqData[itemrow];
        })
        return reqData;
    };

    const commitBody = (commit) => {
        let reqData = {
            companyName: commit.hasOwnProperty("companyName") ? commit.companyName : faker.company.name(),
            firstName: commit.hasOwnProperty("firstName") ? commit.firstName : faker.person.firstName(),
            lastName: commit.hasOwnProperty("lastName") ? commit.lastName : faker.person.lastName(),
            password: commit.hasOwnProperty("password") ? commit.password : Cypress.env("password"),
            region: commit.hasOwnProperty("region") ? commit.region : "IN",
            phone: commit.hasOwnProperty("phone") ? commit.region : faker.string.numeric(10)
        };
        return reqData;
    };

    context(`Success test case for register new user`, () => {
        it(`Send mail for register new user`, () => {
            cy.createInbox().then((inbox) => {
                email = inbox.emailAddress;
                mailId = inbox.id;
                let reqBody = initBody({ uid: email });
                request("POST", route.init, null, null, reqBody).then(({ body, status }) => {
                    responseData(body, util.message2, util.pass, status, util.passStatus);
                    expect(body.result).has.property("userExists", false);
                    expect(body.result).has.property("active", false);
                });
            });
        });

        it(`Get mail for generate company and password`, () => {
            cy.wait(10000);
            cy.waitForLatestEmail(mailId).then(({ body }) => {
                const hreftest = /href="(.*?)"/;
                const href = body.match(hreftest)?.[1];
                const OtpPattern = /otp=([^&]+)/;
                const tokenPattern = /token=([^&]+)/;
                const matchToken = href.match(tokenPattern)?.[1];
                const matchOtp = href.match(OtpPattern)?.[1];
                let reqQs = { "otp": matchOtp };
                let header= { Authorization: `Bearer ${matchToken}` };
              
                request(util.get, route.init, header, reqQs).then(({ body, status }) => {
                    responseData(body, util.message2, util.pass, status, util.passStatus);
                    expect(body.result).has.property("uid", email);
                    expect(body.result).has.property("token", matchToken);

                    // commit the user to generate password

                    request("POST", route.commit, header, reqQs, commitBody({})).then(({ body, status }) => {
                        let msg= "User created successfully";
                        responseData(body, msg, util.pass, status, util.passStatus);
                        expect(body.result).has.property("uid", email);
                        expect(body.result).has.property("cId");

                        // login with new registerd user

                        let reqBody = requestBody({ uid: email });
                        request("POST", route.login, null, null, reqBody).then(({ body, headers, status }) => {
                            set_cookie = headers["set-cookie"];
                            responseData(body, util.message2, util.pass, status, util.passStatus);
                            let reqHeader= { "access-control-allow-credentials":true  };
                            request(util.get, route.renew, reqHeader).then(({ body }) => {
                                token = "Bearer " + body.result.token;
                            });
                        });
                    });
                });
            });
        });

    });
});