import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  imports: [RouterLink],
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent {
  constructor(private location: Location) {}

  goBack() {
    this.location.back(); // מחזיר את המשתמש לדף הקודם שהיה בו
  }
}