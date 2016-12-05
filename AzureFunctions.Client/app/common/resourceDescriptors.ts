import {WebsiteId} from '../models/portal';

export enum ResourceType{
    none,
    site,
    serverFarm,
    hostingEnvironment
}

export class Descriptor{
    public resourceId : string;
    public subscription: string;
    public resourceGroup: string;
    public parts : string[];
    public resourceType = ResourceType.none;

    constructor(resourceId : string){
        this.resourceId = resourceId;
        this.parts = resourceId.split('/').filter(part => !!part);

        if(this.parts.length < 4){
            throw `resourceId length is too short: ${resourceId}`;
        }

        if(this.parts[0].toLowerCase() !== 'subscriptions'){
            throw `Expected subscriptions segment in resourceId: ${resourceId}`;
        }

        if(this.parts[2].toLowerCase() !== 'resourcegroups'){
            throw `Expected resourceGroups segment in resourceId: ${resourceId}`;
        }

        this.subscription = this.parts[1];
        this.resourceGroup = this.parts[3];
    }

    static getDescriptor(resourceId : string){
        let parts = resourceId.split('/').filter(part => !!part);

        if(parts.length >= 7 && parts[6].toLowerCase() === 'sites'){
            return new SiteDescriptor(resourceId);
        }
        else{
            return new Descriptor(resourceId);
        }
    }
}

export class SiteDescriptor extends Descriptor{
    public site: string;
    public slot: string;
    public resourceType = ResourceType.site;
    
    constructor(resourceId : string){
        super(resourceId);

        if(this.parts.length < 8){
            throw `resourceId length is too short for site descriptor: ${resourceId}`;
        }

        if(this.parts[6].toLowerCase() !== 'sites'){
            throw `Expected sites segment in resourceId: ${resourceId}`;
        }

        this.site = this.parts[7];

        if(this.parts.length > 8 && this.parts[8].toLowerCase() === "slots"){
            this.slot = this.parts[9];
        }
    }

    getWebsiteId() : WebsiteId{
        let name = !this.slot ? this.site : `${this.site}(${this.slot})`;
        return {
            Name : name,
            SubscriptionId : this.subscription,
            ResourceGroup : this.resourceGroup
        }
    }
}