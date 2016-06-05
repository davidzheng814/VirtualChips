/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  AlertIOS,
  NativeModules
} from 'react-native';

import { Constants } from './src/Constants'
import { AudioRecorder, AudioUtils } from 'react-native-audio';
var HttpRequest = NativeModules.HttpRequest;
var RNRecordAudio = NativeModules.RNRecordAudio;
import base64 from 'base-64';
import RNFS from 'react-native-fs';

var Status = Constants.STATUS;

function generateBasicAuth(username, password) {
  return 'Basic ' + base64.encode(username + ':' + password);
}

class VirtualChips extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: Status.WAITING,
      transcript:""
    };
  }
  onRecognize(error, rawResponse) {
    let response = JSON.parse(rawResponse);
    let transcript = null;
    let alternatives = response.results.length && response.results[0].alternatives;

    if (alternatives.length) {
      transcript = alternatives[0].transcript;
    }

    this.setState({
      status:Status.WAITING,
      transcript:transcript
    })
  }
  onPress() {
    switch(this.state.status) {
      case Status.WAITING:
        RNRecordAudio.startRecord(
          Constants.audioFile, (res) => {}, (res) => {
            this.setState({status:Status.RECORDING});
          }
        );
        break;

      case Status.RECORDING:
        let headers = {
          'Authorization': generateBasicAuth(Constants.USERNAME, Constants.PASSWORD),
          'Content-Type': Constants.MIME_TYPE,
          'Transfer-Encoding': 'chunked',
        };
        RNRecordAudio.stopRecord(
          Constants.audioFile, (res) => {}, (res) => {
            this.setState({
              status: Status.RECOGNIZING,
            });
            HttpRequest.postFile(Constants.API_URL, headers, 
              RNFS.DocumentDirectoryPath+'/'+Constants.audioFile, this.onRecognize.bind(this));
          }
        );
        break;
    }
  }
  render() {
    return (
      <View style={styles.container}>
        <TouchableHighlight
          onPressIn={this.onPress.bind(this)}
          onPressOut={this.onPress.bind(this)}
          style={styles.button}>
          <Text>Record</Text>
        </TouchableHighlight>
        <Text>{this.state.transcript}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
  }, 
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});

AppRegistry.registerComponent('VirtualChips', () => VirtualChips);
