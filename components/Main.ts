import {bootstrap} from 'angular2/platform/browser';
import AppComp from './App';
import ReadingService from '../medchart/ReadingService';

bootstrap(AppComp, [ReadingService]);
