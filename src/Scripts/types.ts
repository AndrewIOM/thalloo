
// Mapping

type Option<a> = a | undefined

enum Symbology {
    PointIndividual,
    PointClustered
}

enum Projection {
    Arctic,
    Standard
}

type BaseLayer = {
    File: string
    Name: string
    Description: string
}

enum DataType { Continuous, Categorical }
type DataField = {
    Column: string
    Name: string
    Unit: string
    Description: string
    DataType: DataType
}

type MapConfiguration = {
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

type HexCode = string
type Palette = Map<string,HexCode>
type Palettes = Map<string,Palette>
