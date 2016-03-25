declare var data:[any];

import {Component, Input} from 'angular2/core';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import MedChart from '../chart3';

@Component({
  selector: "graph-graph",
  template: `
    <div>
      <div>
        <svg class="chart"></svg>
      </div>
      <div id="brush"></div>
    </div>`,
  host: {
    'id': 'id'
  }
})
export default class GraphComp{
  id: string="lol";
  mc:any;
  @Input() data=[];
  @Input() opts={};
  constructor(){
    this.id=uuid.v4();
  }
  
  ngAfterContentInit(){
    //this.mc=new MedChart([], `.chart`, '#brush', this.opts);
  }
  
  ngOnChanges(){
    console.log("changed from graph");
    if(this.mc){
      this.mc.update(this.data);
    } else {
      if(this.data.length!=0){
        this.currentRange
        this.mc=new MedChart(this.data, `.chart`, '#brush', this.opts);
      }
    }
  }
}

