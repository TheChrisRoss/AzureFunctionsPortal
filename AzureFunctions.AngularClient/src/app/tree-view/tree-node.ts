import { Disposable } from './tree-node';
import {Subject} from 'rxjs/Rx';
import {SideNavComponent} from '../side-nav/side-nav.component';
import {DashboardType} from './models/dashboard-type';
import {TreeViewInfo} from './models/tree-view-info';
import {Subscription} from '../shared/models/subscription';

export interface CustomSelection{
    handleSelection();
}

export interface Disposable{
    dispose(newSelectedNode? : TreeNode);
}

export interface Removable{
    remove();
}

export interface Refreshable{
    refresh();
}

export interface CanBlockNavChange{
    // Give a node a chance to prevent a user from navigating away
    shouldBlockNavChange() : boolean;
}

export interface MutableCollection{
    addChild(child : any);
    removeChild(child : any, callRemoveOnChild? : boolean);
}

export class TreeNode implements Disposable, Removable, CanBlockNavChange, CustomSelection{
    public isExpanded : boolean;
    public showExpandIcon : boolean = true;
    public iconClass : string;
    public isLoading : boolean;
    public children : TreeNode[] = [];
    public title : string;
    public dashboardType : DashboardType;
    public newDashboardType : DashboardType;
    public supportsAdvanced = false;
    public supportsScope = false;
    public disabled = false;

    constructor(
        public sideNav : SideNavComponent,
        public resourceId : string,
        public parent : TreeNode){}

    public select(){
        if(this.disabled || !this.resourceId){
            return;
        }

        this.sideNav.updateView(this, this.dashboardType);
        
        if(!this.isExpanded){
            this.toggle(null);
        }
    }

    // Virtual
    public handleSelection(){
    }

    public refresh(){
        if(this.isExpanded){
            this._loadChildren();
        }

        this.sideNav.updateView(this, this.dashboardType);
    }

    public toggle(event){
        
        if(!this.isExpanded){
            this.isLoading = true;
            this.isExpanded = true;

            this._loadChildren();
        }
        else{
            this.isExpanded = false;
        }

        if(event){
            event.stopPropagation();
        }
    }

    public openCreateNew(event){
        this.sideNav.updateView(this, this.newDashboardType);
    }

    public shouldBlockNavChange() : boolean{
        return false;
    }

    protected _loadChildren(){
        this._doneLoading();
    }

    protected _doneLoading(){
        this.isLoading = false;
        // this.showExpandIcon = !!this.children && this.children.length > 0;
        if(this.children && this.children.length === 1 && !this.children[0].isExpanded){
            this.children[0].toggle(null);
        }
    }

    public dispose(newSelectedNode? : TreeNode){
    }

    public remove(){
    }

    protected _removeHelper(removeIndex : number, callRemoveOnChild? : boolean){
        if(removeIndex > -1){
            let child = this.children[removeIndex];
            this.children.splice(removeIndex, 1);
            
            if(callRemoveOnChild){
                child.remove();
            }

            this.sideNav.clearView(child.resourceId);
        }
    }

    public getTreePathNames(){
        let path : string[] = [];
        let curNode : TreeNode = this;
        
        while(curNode){
            path.splice(0, 0, curNode.title);
            curNode = curNode.parent;
        }

        return path;
    }

    public scopeToNode(){
        this.sideNav.searchExact(this.title);
    }
}