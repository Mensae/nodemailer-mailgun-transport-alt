const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const MailgunTransport = require('../src/mailgun-transport');

require('mocha-sinon');

const expect = chai.expect;

chai.use(sinonChai);

describe('when sending a mail', () => {
    beforeEach(() => {
        this.transport = new MailgunTransport({
            auth: {
                api_key: 'test'
            }
        });

        sinon.stub(this.transport.messages, 'send').callsArgWith(1, null, {
            id: '<20111114174239.25659.5817@samples.mailgun.org>',
            message: 'Queued. Thank you.'
        });
    });

    describe('with allowed data', () => {
        it('should send all the data to mailgun', (done) => {
            const data = {
                from: 'from@bar.com',
                to: 'to@bar.com',
                cc: 'cc@bar.com',
                bcc: 'bcc@bar.com',
                subject: 'Subject',
                text: 'Hello',
                html: '<b>Hello</b>',
                attachment: [],
                'o:tag': 'Tag',
                'o:campaign': 'Campaign',
                'o:dkim': 'yes',
                'o:deliverytime': 'Thu, 13 Oct 2011 18:02:00 GMT',
                'o:testmode': 'yes',
                'o:tracking': 'yes',
                'o:tracking-clicks': 'yes',
                'o:tracking-opens': 'yes',
                'o:require-tls': 'yes',
                'o:skip-verification': 'yes',
                'h:Reply-To': 'reply@bar.com',
                'v:foo': 'bar'
            };

            this.transport.send({
                data: data
            }, (err, info) => {
                expect(this.transport.messages.send).to.have.been.calledWith({
                    from: 'from@bar.com',
                    to: 'to@bar.com',
                    cc: 'cc@bar.com',
                    bcc: 'bcc@bar.com',
                    subject: 'Subject',
                    text: 'Hello',
                    html: '<b>Hello</b>',
                    attachment: [],
                    'o:tag': 'Tag',
                    'o:campaign': 'Campaign',
                    'o:dkim': 'yes',
                    'o:deliverytime': 'Thu, 13 Oct 2011 18:02:00 GMT',
                    'o:testmode': 'yes',
                    'o:tracking': 'yes',
                    'o:tracking-clicks': 'yes',
                    'o:tracking-opens': 'yes',
                    'o:require-tls': 'yes',
                    'o:skip-verification': 'yes',
                    'h:Reply-To': 'reply@bar.com',
                    'v:foo': 'bar'
                });
                expect(err).to.be.null;
                expect(info.messageId).to.equal('<20111114174239.25659.5817@samples.mailgun.org>');

                done();
            });
        });

        it('should convert attachments to Mailgun format', (done) => {
            const data = {
                from: 'from@bar.com',
                to: 'to@bar.com',
                subject: 'Subject',
                text: 'Hello',
                attachment: [{
                    path: '/',
                    filename: 'CONTRIBUTORS.md',
                    contentType: 'text/markdown',
                    knownLength: 122
                }]
            };

            this.transport.send({
                data: data
            }, (err, info) => {
                expect(this.transport.messages.send).to.have.been.calledOnce;

                const call = this.transport.messages.send.getCall(0);
                expect(call.args[0].attachment).to.have.length(1);

                const attachment = call.args[0].attachment[0];
                expect(attachment.path).to.equal('/');
                expect(attachment.filename).to.equal('CONTRIBUTORS.md');
                expect(attachment.contentType).to.equal('text/markdown');
                expect(attachment.knownLength).to.equal(122);
                expect(err).to.be.null;
                expect(info.messageId).to.equal('<20111114174239.25659.5817@samples.mailgun.org>');

                done();
            });
        });

        it('allow using array to assgin multiple receiver', (done) => {
            const data = {
                from: 'from@bar.com',
                to: ['to@bar.com', 'to1@bar.com'],
                subject: 'Subject',
                text: 'Hello',
                html: '<b>Hello</b>',
            };

            this.transport.send({
                data: data
            }, (err, info) => {
                expect(this.transport.messages.send).to.have.been.calledWith({
                    from: 'from@bar.com',
                    to: 'to@bar.com,to1@bar.com',
                    subject: 'Subject',
                    text: 'Hello',
                    html: '<b>Hello</b>',
                });
                expect(err).to.be.null;
                expect(info.messageId).to.equal('<20111114174239.25659.5817@samples.mailgun.org>');

                done();
            });
        });
    });

    describe('with disallowed data', () => {
        it('should filter out the invalid data', (done) => {
            const data = {
                from: 'from@bar.com',
                to: 'to@bar.com',
                subject: 'Subject',
                text: 'Hello',
                foo: 'bar'
            };

            this.transport.send({
                data: data
            }, (err, info) => {
                expect(this.transport.messages.send).to.have.been.calledWith({
                    from: 'from@bar.com',
                    to: 'to@bar.com',
                    subject: 'Subject',
                    text: 'Hello'
                });
                expect(err).to.be.null;
                expect(info.messageId).to.equal('<20111114174239.25659.5817@samples.mailgun.org>');

                done();
            });
        });
    });

    describe('with simple address objects', () => {
        it('should convert to standard address format', (done) => {
            const data = {
                from: { "name": 'From', "address": 'from@bar.com' },
                to: { "name": 'To', "address": 'to@bar.com' },
                cc: { "name": 'Cc', "address": 'cc@bar.com' },
                bcc: { "name": 'Bcc', "address": 'bcc@bar.com' },
                subject: 'Subject',
                text: 'Hello',
            };

            this.transport.send({
                data: data
            }, (err, info) => {
                expect(this.transport.messages.send).to.have.been.calledWith({
                    from: 'From <from@bar.com>',
                    to: 'To <to@bar.com>',
                    cc: 'Cc <cc@bar.com>',
                    bcc: 'Bcc <bcc@bar.com>',
                    subject: 'Subject',
                    text: 'Hello'
                });
                expect(err).to.be.null;
                expect(info.messageId).to.equal('<20111114174239.25659.5817@samples.mailgun.org>');

                done();
            });
        });
    });

    describe('with address objects missing data or having multiple entries (array of objects)', () => {
        it('should convert to standard address format and skip missing data', (done) => {
            const data = {
                from: { "name": null, "address": 'from@bar.com' },
                to: [{ "name": 'To', "address": 'to@bar.com' }, { "name": null, "address": "to2@bar.com" }, { "address": "to3@bar.com" }, { "name": undefined, "address": undefined }],
                cc: [{ "name": 'Cc', "address": 'cc@bar.com' }, { "name": null, "address": "cc2@bar.com" }, { "address": "cc3@bar.com" }, { "name": "", "address": "" }],
                bcc: [{ "name": 'Bcc', "address": 'bcc@bar.com' }, { "name": null, "address": "bcc2@bar.com" }, { "address": "bcc3@bar.com" }, { "name": "Bcc4" }],
                replyTo: { "name": 'ReplyTo', "address": 'replyto@bar.com' },
                subject: 'Subject',
                text: 'Hello',
            };

            this.transport.send({
                data: data
            }, (err, info) => {
                expect(this.transport.messages.send).to.have.been.calledWith({
                    from: 'from@bar.com',
                    to: 'To <to@bar.com>,to2@bar.com,to3@bar.com',
                    cc: 'Cc <cc@bar.com>,cc2@bar.com,cc3@bar.com',
                    bcc: 'Bcc <bcc@bar.com>,bcc2@bar.com,bcc3@bar.com',
                    'h:Reply-To': 'ReplyTo <replyto@bar.com>',
                    subject: 'Subject',
                    text: 'Hello'
                });
                expect(err).to.be.null;
                expect(info.messageId).to.equal('<20111114174239.25659.5817@samples.mailgun.org>');

                done();
            });
        });
    });

    describe('with a replyTo address set', () => {
        it('should convert it to "h:Reply-To" property ', (done) => {
            const data = {
                from: 'from@bar.com',
                to: 'to@bar.com',
                replyTo: 'replyto@bar.com',
                subject: 'Subject',
                text: 'Hello',
            };

            this.transport.send({
                data: data
            }, (err, info) => {
                expect(this.transport.messages.send).to.have.been.calledWith({
                    from: 'from@bar.com',
                    to: 'to@bar.com',
                    'h:Reply-To': 'replyto@bar.com',
                    subject: 'Subject',
                    text: 'Hello'
                });
                expect(err).to.be.null;
                expect(info.messageId).to.equal('<20111114174239.25659.5817@samples.mailgun.org>');

                done();
            });
        });
    });
});
