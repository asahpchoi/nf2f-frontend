import {
  Component,
  ViewChild,
  OnInit,
  NgZone,
  AfterViewInit
} from "@angular/core";
import { Socket } from "ngx-socket-io";
import { SignaturePad } from "angular2-signaturepad/signature-pad";
import * as uuid from "uuid";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements AfterViewInit, OnInit {
  onlineSession = 0;
  data = "";
  url = "";
  @ViewChild(SignaturePad) signaturePad: SignaturePad;
  fileList = [];
  isCustomer = false;
  turnOnSection = "";
  fileView;
  fileMessage;
  formdata = {
    name: "",
    phone: ""
  };

  updateform() {
    this.socket.emit("updateForm", this.formdata);
  }

  getFileNames = o =>
    Object.values(o[0])
      .filter(d => d.name)
      .map(d => d.name);

  getCustomerLink() {
    return window.location.href + "&customer=1";
  }

  roomJoined() {
    return !(window.location.hash === "");
  }

  private signaturePadOptions: Object = {
    // passed through to szimek/signature_pad constructor
    minWidth: 5,
    canvasWidth: screen.width,
    canvasHeight: screen.height / 2
  };
  constructor(private socket: Socket, private _ngZone: NgZone) {
    this.socket.on("getData", data => {
      //console.log("DATA" + data);
      this.signaturePad.clear();
      this.signaturePad.fromDataURL(data);
    });
    this.socket.on("sendForm", data => {
      //console.log("DATA" + data);
      this.formdata = data;
    });

    this.socket.on("DocUploaded", data => {
      this.fileList.push(data);
      //update fileview
      this.fileView = this.getFileNames(this.fileList);
    });
    this.socket.on("controlTo", data => {
      this.turnOnSection = data;
      this.updateFileView();
    });

    this.socket.on("online", data => {
      console.log({
        online: data
      });
      this.onlineSession = data;
    });
  }

  async clearSession() {
    let response = await fetch("https://8op5b.sse.codesandbox.io/close");
    let data = await response.json();
    return data;
  }
  clear() {
    this.signaturePad.clear();
  }

  ngOnInit() {
    this.join();
  }

  updateSection() {
    const s = document.querySelector('input[name="section"]:checked').value;
    this.turnOnSection = s;
    this.socket.emit("controlFrom", s);
    if (!this.isCustomer && this.roomJoined()) {
      if (this.signaturePad) this.signaturePad.off();
    }
  }

  updateFileView() {
    this.fileListView = Object.values(this.fileList[0])
      .filter(x => x.name != null)
      .map(x => x.name);
  }

  join() {
    const roomid = window.location.hash;
    if (roomid) {
      this.url = roomid.replace("&customer=1", "");
      this.socket.emit("join", roomid.replace("&customer=1", ""));
      this.isCustomer = roomid.includes("customer=1");
    }

    //signature-pad
    //var ss = require("socket.io-stream");
  }

  uploadDoc() {
    const file = document.getElementById("fileupload");
    //console.log(file.files);
    this.fileMessage = "File Uploaded";
    this.socket.emit("uploadDoc", file.files);
  }

  drawComplete() {
    // will be notified of szimek/signature_pad's onEnd event
    const data = this.signaturePad.toDataURL();
    this.socket.emit("sendData", data);
    //console.log(data);
  }

  create() {
    const id = uuid.v4();
    window.document.location.href = "#" + id; // + "&customer=1";
    window.document.location.reload();
  }

  ngAfterViewInit() {}

  drawStart() {
    // will be notified of szimek/signature_pad's onBegin event
    //console.log('begin drawing');
  }
}
