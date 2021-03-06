import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/std:accounts-ui';
import 'meteor/deanius:promise';

import { Promise } from 'bluebird';
import React from 'react';
import { Grid, Row, Col, Table, Button, ButtonToolbar, Well,
    Form, FormGroup, FormControl, ControlLabel, HelpBlock,
    Radio
 } from 'react-bootstrap';
import ReactDOM, { findDOMNode } from 'react-dom';
import { IndexLink, Link, browserHistory } from 'react-router';
import { IndexLinkContainer, LinkContainer } from 'react-router-bootstrap';
import Script from 'react-load-script';
import Tracker from 'tracker-component';

import Alert from 'react-s-alert';

import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/slide.css';
import 'react-s-alert/dist/s-alert-css-effects/scale.css';
import 'react-s-alert/dist/s-alert-css-effects/flip.css';
import 'react-s-alert/dist/s-alert-css-effects/jelly.css';
import 'react-s-alert/dist/s-alert-css-effects/stackslide.css';
import 'react-s-alert/dist/s-alert-css-effects/genie.css';
import 'react-s-alert/dist/s-alert-css-effects/bouncyflip.css';

import { RegisterPollFormKor, RegisterPollFormNonKor, RegisterPollFormCommon } from './RegisterPollForm.jsx';

export class GetTicketForm extends Tracker.Component {
  constructor(props) {
    super(props);
    this.state = {
      isKorean : false,
      isNonKorean : false,
      agreedKoreanPrivacyPolicy : false,
      korName : '',
      mobilePhoneNum : '',
      nationality : '',
      engLastName : '',
      engFirstName : '',
      affiliation : '',
      position : '',
      advisorName : '',
      willPresentPoster : false
    };
    this.autorun(() => {
      this.setState({
        isAuthenticated: Meteor.user()
      });
    });
  }

  handleIamPortOnLoad() {
    IMP.init('imp33162581');
  }

  handleIamPortOnError(err) {
    var msg = '결제 모듈을 불러오지 못했습니다. ';
    alert(msg + err);
  }

  handleKor(event) {
    this.setState({ isKorean : true });
    this.setState({ isNonKorean : false });
  }

  handleNonKor(event) {
    this.setState({ isKorean : false });
    this.setState({ isNonKorean : true });
  }

  handleOnChange(_change) {
    // wait for setstate
    this.setState(_change);
  }

  handleKorOnSubmit(event) {
    event.preventDefault();
    // no need to setTimeout because it takes to tiem to pay
    const _amount = Meteor.settings.public.IAMPORT_FEE_AMOUNT;
    const _merchant_uid = new Date().getTime();

    // promisified reqeust_pay
    function IMPrequestPay(param){
      return new Promise(function(resolve, reject){
         IMP.request_pay(param, function(rsp) {
           if (rsp.success) {
             resolve(rsp);
           }
           return reject(new Error(rsp.error_msg));
         });
      });
    }

    Meteor.callPromise('iamport.prerpareValidation', {
      merchant_uid : _merchant_uid,
      amount : _amount
    })
    .then(() => {
      return IMPrequestPay({
        pg : 'uplus',
        pay_method : 'card',
        merchant_uid : _merchant_uid,
        name : '2017 Winter School in Imaging Science',
        amount : _amount,
        buyer_email : Meteor.user().emails[0].address,
        buyer_name : this.state.korName,
        buyer_tel : this.state.mobilePhoneNum
      })
    })
    .then((rsp) => {
      return Meteor.callPromise('iamport.checkPaymentValid', {
        merchant_uid : _merchant_uid
      })
    })
    .then(() => {
      return Meteor.callPromise('tickets.insertKor', {
        isKorean : true,
        isPaid : true,
        engLastName : this.state.engLastName.trim(),
        engFirstName : this.state.engFirstName.trim(),
        affiliation : this.state.affiliation.trim(),
        position : this.state.position.trim(),
        advisorName : this.state.advisorName.trim(),
        willPresentPoster : (this.state.willPresentPoster == 'true'),
        agreedKoreanPrivacyPolicy : this.state.agreedKoreanPrivacyPolicy,
        korName : this.state.korName.trim(),
        mobilePhoneNum : this.state.mobilePhoneNum.trim()
      });
    })
    .then(() => {
      var msg = '등록에 성공하였습니다.';
      msg += '결제 금액 : ' + rsp.paid_amount;
      alert(msg);
      done();
    })
    .catch(() => {
      console.log.bind(console);

      Meteor.callPromise('iamport.cancelPayment', {
        merchant_uid : _merchant_uid
      });
    });
  }

  handleNonKorOnSubmit(event) {
    event.preventDefault();
    // wait for setstate
    setTimeout(function() {
      Meteor.call('tickets.insertNonKor', {
        isKorean : false,
        isPaid : false,
        engLastName : this.state.engLastName.trim(),
        engFirstName : this.state.engFirstName.trim(),
        affiliation : this.state.affiliation.trim(),
        position : this.state.position.trim(),
        advisorName : this.state.advisorName.trim(),
        willPresentPoster : (this.state.willPresentPoster == 'true'),
        nationality : this.state.nationality.trim()
      }, (err, res) => {
        if (err) {
          event.preventDefault();
          Alert.error(err, {
            position: 'top'
          });
        } else {
          // success!
          Alert.success('You have succefully registred!', {
            position: 'top'
          });
        }
      });
    }.bind(this), 1000);
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
          <Well bsSize="large">
            <section className="RegisterForm">
              <Row>
                <ButtonToolbar>
                  <Col xs={6}>
                    <Col xsOffset={3}>
                      <Button bsSize="large" onClick={ this.handleKor.bind(this) } > Korean </Button>
                    </Col>
                  </Col>
                  <Col xs={6}>
                    <Col xsOffset={3}>
                      <Button bsSize="large" onClick={ this.handleNonKor.bind(this) }> Non-Korean </Button>
                    </Col>
                  </Col>
                </ButtonToolbar>
              </Row>
              {
                this.state.isKorean && !this.state.isNonKorean && <Form onSubmit={ this.handleKorOnSubmit.bind(this) }>
                    <RegisterPollFormKor onChange={ this.handleOnChange.bind(this) } />
                    <RegisterPollFormCommon onChange={ this.handleOnChange.bind(this) } />
                    <Button bsSize="large" block type="submit"> 제출 및 결제하기 </Button>
                  </Form>
              }
              {
                !this.state.isKorean && this.state.isNonKorean && <Form onSubmit={ this.handleNonKorOnSubmit.bind(this) } >
                  <RegisterPollFormNonKor onChange={ this.handleOnChange.bind(this) } />
                  <RegisterPollFormCommon onChange={ this.handleOnChange.bind(this) } />
                  <Button bsSize="large" block type="submit"> Submit  </Button>
                </Form>
              }
              <Script
                url="https://service.iamport.kr/js/iamport.payment-1.1.2.js"
                onError={ this.handleIamPortOnError.bind(this) }
                onLoad={ this.handleIamPortOnLoad.bind(this) }
              />
              </section>
         </Well>
        </Col>
      </Row>

      <Alert stack={{limit: 3}} />
    </Grid>
    )
  }
}
