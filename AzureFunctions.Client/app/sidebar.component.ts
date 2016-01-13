import {Component, OnInit, EventEmitter} from 'angular2/core';
import {FunctionsService} from './functions.service';
import {FunctionInfo} from './function-info';
import {VfsObject} from './vfs-object';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

@Component({
    selector: 'sidebar',
    templateUrl: 'templates/sidebar.html',
    inputs: ['functionsInfo'],
    outputs: ['functionSelected: selectedFunction', 'fileSelected: selectedFile']
})
export class SideBarComponent {
    public functionsInfo: FunctionInfo[];
    public selectedFunction: FunctionInfo;
    public selectedFile: VfsObject;
    private functionSelected: EventEmitter<FunctionInfo>;
    private fileSelected: EventEmitter<VfsObject>;
    private clickStream: Subject<FunctionInfo>;
    private fileClickStream: Subject<VfsObject>;

    constructor(private _functionsService: FunctionsService) {
        this.functionSelected = new EventEmitter<FunctionInfo>();
        this.fileSelected = new EventEmitter<VfsObject>();
        this.clickStream = new Subject();
        this.fileClickStream = new Subject();

        this.clickStream
            //.distinctUntilChanged() doesn't work because fileClickStream can change the selected Function
            .switchMap(fi => {
                this.selectedFunction = fi;
                this.functionSelected.next(fi);
                this.fileSelected.next(null);
                if (fi.name === 'New Function') {
                    return Observable.empty<any>();
                } else if (fi.name === 'Settings') {
                    return Observable.of({
                        files: [{ name: "host.json", href: "mocks/host.json" }],
                        functionInfo: fi
                    });
                } else {
                    return this._functionsService.getFunctionContent(fi)
                }
            })
            .subscribe((res: any) => {
                res.functionInfo.files = res.files;
            });

        this.fileClickStream
            .distinctUntilChanged()
            .switchMap<string>(file =>  {
                this.selectedFile = file;
                return this._functionsService.getFileContent(file)
            })
            .subscribe(content => {
                this.selectedFile.content = content;
                this.fileSelected.next(this.selectedFile)
            });
    }

    toggle(fi: FunctionInfo) {
        fi.expanded = !fi.expanded;
    }

    onFileClick(file: VfsObject, functionInfo: FunctionInfo, event: Event) {
        this.fileClickStream.next(file);
        this.selectedFunction = functionInfo;
        this.functionSelected.next(functionInfo);
        event.stopPropagation();
        event.preventDefault();
    }
}