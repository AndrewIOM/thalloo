
// Mapping

export type Option<a> = a | undefined

export enum Symbology {
    PointIndividual = "individual",
    PointClustered = "cluster"
}

export enum Projection {
    Arctic = "arctic",
    Standard = "standard"
}

export type BaseLayer = {
    File: string
    Name: string
    Description: string
}

export enum DataType { Continuous = "float", Categorical = "string" }
export type DataField = {
    Column: string
    Name: string
    Unit: string
    Description: string
    DataType: DataType
}

export type MapConfiguration = {
    Name:               string
    Description:        string
    Logos:              string[]
    Publication:        string
    Projection:         Projection
    DisplayMode:        Symbology
    DisplayUnit:        string
    ClusterDistance:    number
    MapCentre:          [number, number]
    MapZoomLevel:       number
    MaxPieSize:         number
    BaseLayers:         BaseLayer[]
    Fields:             DataField[]
    DataPalettes:       Palettes
}

export type HexCode = string
export type PaletteItem = { Name: string, Hex: string }
export type Palette = { Column: string, Palette: PaletteItem[] }
export type Palettes = Palette[]
