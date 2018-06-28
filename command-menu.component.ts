'use strict';

/**
 * Angular imports
 */
import { Component, OnDestroy } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { OverlayRef } from '@angular/cdk/overlay';

/**
 * 3rd-party imports
 */
import { Observable, Subject } from 'rxjs';

/**
 * Constants and Typescript entities
 */
export interface Command {
  method?: string;
  children?: Command[];
  icon: string;
  tooltip: string;
  disabled: boolean;
}

const CMD_BUTTON_SIZE = 40;
const DISTANCE_FROM_ORIGIN = 40;

@Component( {
  templateUrl: './command-menu.component.html',
  styleUrls: [ './command-menu.component.scss' ],
  animations: [
    trigger( 'displayCommands', [
      transition( ':enter', [
        style( {
          transform: `translate(${DISTANCE_FROM_ORIGIN}px, -${CMD_BUTTON_SIZE / 2}px) rotate(-90deg)`,
          width: '0',
          height: '0',
          opacity: '0'
        } ),
        animate( '500ms ease-in-out', style( {
          transform: '*',
          width: CMD_BUTTON_SIZE + 'px',
          height: CMD_BUTTON_SIZE + 'px',
          opacity: '1'
        } ) )
      ] )
    ] )
  ]
} )
export class CommandMenuComponent implements OnDestroy {
  commands: Command[];
  subCommands: Command[];
  displaySecondLevel = false;
  secondLevelPosition: { [ prop: string ]: string };

  private commandMenuSubject: Subject<Command>;
  private portalOutlet: OverlayRef;

  /*******************************************************************************************************************\
   *                                                                                                                 *
   *                                              Lifecycle hooks                                                    *
   *                                                                                                                 *
   \******************************************************************************************************************/

  ngOnDestroy() {
    // Resetting disabled state for all commands
    for ( const cmd of this.commands ) {
      cmd.disabled = false;

      if ( cmd.children ) {
        for ( const subcmd of cmd.children ) {
          subcmd.disabled = false;
        }
      }
    }

    this.commandMenuSubject.next( null );
  }

  /*******************************************************************************************************************\
   *                                                                                                                 *
   *                                                Event handlers                                                   *
   *                                                                                                                 *
   \******************************************************************************************************************/

  onCommandButtonClicked( e: MouseEvent, command: Command, index: number ) {
    // Make sure the click on the button doesn't trigger a click on the underlying overlay panel
    e.stopImmediatePropagation();

    if ( command.method ) {
      this.commandMenuSubject.next( command );
      this.portalOutlet.dispose();
    } else {
      if ( this.displaySecondLevel ) {
        // A second level is already displayed, close it and re-enable other first-level commands
        this.displaySecondLevel = false;
        for ( const cmd of this.commands ) {
          if ( cmd !== command ) {
            cmd.disabled = false;
          }
        }
      } else {
        // Disable all the other commands of the first level
        for ( const cmd of this.commands ) {
          if ( cmd !== command ) {
            cmd.disabled = true;
          }
        }

        // Display the second level of children commands
        this.subCommands = command.children;
        const cmdButtonAngle: number = ( -90 + index * ( 360 / this.commands.length ) ) * ( Math.PI / 180 );
        this.secondLevelPosition = {
          'top': ( CMD_BUTTON_SIZE * 1.5 * Math.sin( cmdButtonAngle ) ) + 'px',
          'left': ( CMD_BUTTON_SIZE * 1.5 * Math.cos( cmdButtonAngle ) ) + 'px'
        };
        this.displaySecondLevel = true;
      }
    }
  }

  /*******************************************************************************************************************\
   *                                                                                                                 *
   *                                                 Other methods                                                   *
   *                                                                                                                 *
   \******************************************************************************************************************/

  initComponent( commands: Command[], overlay: OverlayRef ): Observable<Command> {
    this.commands = commands;
    this.portalOutlet = overlay;
    this.commandMenuSubject = new Subject<Command>();

    return this.commandMenuSubject.asObservable();
  }

  getStyleForCommandButton( index: number, nbCommands: number ): { [ prop: string ]: string } {
    return {
      'transform': `translate(${DISTANCE_FROM_ORIGIN}px, -${CMD_BUTTON_SIZE / 2}px) rotate(${-90 + index * ( 360 / nbCommands )}deg)`
    };
  }

  getStyleForCommandIcon( index: number, nbCommands: number ): { [ prop: string ]: string } {
    return {
      'transform': `rotate(${90 - index * ( 360 / nbCommands )}deg)`,
      'vertical-align': 'baseline'
    };
  }
}
