import { Component } from './component';
import { EntityEvent, Event, SceneEvent } from './event';
import { Service } from './service';

export type ComponentClass<T extends Component = Component> = new (...args: any[]) => T;
export type ServiceClass<T extends Service = Service> = new (...args: any[]) => T;
export type EventClass<T extends Event = Event> = new (...args: any[]) => T;
export type EventListener<T extends Event> = (event: T) => void;
export type EntityEventClass<T extends EntityEvent = EntityEvent> = new (...args: any[]) => T;
export type SceneEventClass<T extends SceneEvent = SceneEvent> = new (...args: any[]) => T;

export type ComponentEntry<T extends Component = Component> = [ComponentClass<T>, ...any[]];
