import { Component, OnInit } from '@angular/core';
import { CustomRichTextTypeEnum } from 'src/app/shared/generated/enum/custom-rich-text-type-enum';

@Component({
    selector: 'nebula-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss'],
    standalone: false
})
export class HelpComponent implements OnInit {

  public richTextTypeID : number = CustomRichTextTypeEnum.Help;

  constructor() { }

  ngOnInit() {
  }

}
