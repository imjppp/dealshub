// JSLib modules ('/document.js', '/nodes.js', ...) ship inside Affinity and are untyped: treat their exports as any.
declare module '/*.js' {
  export const Document: any, Selection: any, Dialog: any, DialogResult: any, File: any, Curve: any, PolyCurve: any,
    Rectangle: any, AddChildNodesCommandBuilder: any, CompoundCommandBuilder: any, DocumentCommand: any,
    ContainerNodeDefinition: any, PolyCurveNodeDefinition: any, FillDescriptor: any, Colour: any,
    LineStyleDescriptor: any, UnitType: any;
}
declare function unescape(s: string): string;
declare function escape(s: string): string;
declare const console: { log(...a: any[]): void };
declare function alert(message: string, title?: string): void;
