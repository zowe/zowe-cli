import { FSWatcher } from "fs";
import { EventTypes } from "./EventConstants";
import { IEventJson } from "./doc";

export class Event implements IEventJson {
    eventTime: string;
    eventName: string;
    eventType: EventTypes;
    appName: string;
    filePath: string;
    watchers: FSWatcher[];

    constructor({ eventTime, eventName, eventType, appName, filePath: eventFilePath, watchers}: IEventJson) {
        this.eventTime = eventTime;
        this.eventName = eventName;
        this.eventType = eventType;
        this.appName = appName;
        this.filePath = eventFilePath;
        this.watchers = watchers;
    }

    public toJson() {
        return {
            eventTime: this.eventTime,
            eventName: this.eventName,
            eventType: this.eventType,
            appName: this.appName,
            eventFilePath: this.filePath
        };
    }
}