import { EventTypes } from "./EventConstants";
import { IEventJson } from "./doc";

export class Event implements IEventJson {
    eventTime: string;
    eventName: string;
    eventType: EventTypes;
    appName: string;
    eventFilePath: string;

    constructor({ eventTime, eventName, eventType, appName, eventFilePath }: IEventJson) {
        this.eventTime = eventTime;
        this.eventName = eventName;
        this.eventType = eventType;
        this.appName = appName;
        this.eventFilePath = eventFilePath;
    }

    public toJson() {
        return {
            eventTime: this.eventTime,
            eventName: this.eventName,
            eventType: this.eventType,
            appName: this.appName,
            eventFilePath: this.eventFilePath
        };
    }
}