import * as moment from 'moment';
import {Component, Input} from 'angular2/core';
import {FORM_DIRECTIVES} from 'angular2/common';
import ReadingService from './ReadingService';

@Component({
  selector: 'graph-form',
  template: `<form (ngSubmit)="onSubmit(f.value)" #f="ngForm">
    <div>
      pulse: <input type='text' ngControl="pulse" value="10"/>
    </div>
    <div>
      systole: <input type='text' ngControl="systole" value="10"/>
    </div>
    <div>
      diastole: <input type='text' ngControl="diastole" value="10"/>
    </div>
    <div>
      <button type='submit'>Add value</button>
    </div>
  </form>`,
  directives: [FORM_DIRECTIVES]
})
export default class FormComp{
  @Input('graph-changed') graphChanged:any;
  
  constructor(public readings: ReadingService){
  }
  
  onSubmit(val){
    console.log(val);
    this.readings.append({
      pulse: parseInt(val.pulse),
      sys: parseInt(val.systole),
      dias: parseInt(val.diastole)
    });
  }
}
