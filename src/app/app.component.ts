import {Component, OnDestroy, OnInit, HostListener} from '@angular/core';
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import {BundleService} from './bundle.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [BundleService]
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'FHIR: Observation';
  serverBaseUrl = 'http://localhost:9090';
  websocketUrl: string = this.serverBaseUrl + '/websocket-fhir';
  hapiClientUrl: string = this.serverBaseUrl + '/hapi';

  ws: any;

  hapiClientObservationUrl: string = this.hapiClientUrl + '/Observation';
  bundle: any;
  pageCount = 1;
  pageUrl: string;
  observationList: Array<any> = [];
  newObservationCount = 0;

  showScroll: boolean;
  showScrollHeight = 350;
  hideScrollHeight = 15;

  constructor (private bundleService: BundleService) {}

  ngOnInit() {
    this.getBundle();
    this.connectWebSocket();
  }

  ngOnDestroy() {
    this.disconnectWebsocket();
  }

  getBundle() {
    this.pageUrl = this.pageCount > 1 ? this.hapiClientObservationUrl + '?url=' + encodeURIComponent(this.bundle.nextLinkUrl)
      : this.hapiClientObservationUrl;
    this.bundleService.getByUrl(this.pageUrl).subscribe((response) => this.appendData(response));
  }

  appendData = (bundle) => {
    console.log('Scroll: Appending 10 items to observationList[' + this.observationList.length + ']');
    this.bundle = bundle;
    this.pageCount++;
    for (const observation of bundle.resourceList) {
      this.observationList.push(observation);
    }
    console.log('Scroll: Appended 10 item to observationList[' + this.observationList.length + ']');
  }

  prependData = (observation) => {
    observation['isNew'] = true;
    this.observationList.unshift(observation);
    if (this.showScroll) {
      this.newObservationCount++;
    }
  }

  onScroll() {
    this.getBundle();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (( window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) > this.showScrollHeight) {
      this.showScroll = true;
    } else if (this.showScroll && (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) < this.hideScrollHeight) {
      this.showScroll = false;
    }
  }

  scrollToTop() {
    this.newObservationCount = 0;
    (function smoothscroll() {
      const currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
      if (currentScroll > 0) {
        window.requestAnimationFrame(smoothscroll);
        window.scrollTo(0, currentScroll - (currentScroll / 5));
      }
    })();
  }

  isObservationNew(tooltip, observation) {
    if (observation.isNew) {
      tooltip.open();
      setTimeout(() => {
        observation.isNew = null;
      }, 3000);
    } else {
      tooltip.close();
    }
  }

  connectWebSocket() {
    const socket = new SockJS(this.websocketUrl);
    this.ws = Stomp.over(socket);
    const that = this;
    this.ws.connect({}, function(frame) {
      that.ws.subscribe('/errors', function(push) {
        console.log('Error ' + push.body);
      });
      that.ws.subscribe('/observation', function(push) {
        console.log('WebSocket: Prepending 1 item to observationList[' + that.observationList.length + ']');
        that.prependData(JSON.parse(push.body));
        console.log('WebSocket: Prepended 1 item to observationList[' + that.observationList.length + ']');
      });
    }, function(error) {
      console.log('STOMP error ' + error);
    });
  }

  disconnectWebsocket() {
    if (this.ws != null) {
      this.ws.ws.close();
    }
    console.log('Disconnected');
  }

}
