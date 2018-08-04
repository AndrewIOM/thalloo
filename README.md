# *Thalloo* Evidence-Mapping: A Jekyll Theme

This project provides an easy-to-use template for web visualisations of environmental evidence maps.

## What is an evidence map?

Evidence maps provide a comprehensive overview - or *map* - of a particular topic. In environmental sciences, many maps are geo-temporal in nature, capturing evidence across space and through time. All evidence maps are created using evidence-based or systematic methodologies, providing rich datasets. However, exploration of these datasets can be challenging when interrogating the raw data itself. 

## What is Thalloo?

Thalloo is a combination of map components and a Jekyll theme that enable quick, simple, and customisable deployment of a web-based tool to display evidence maps. The framework has the following features:

- Visual clustering and display of categorical data. Given a display category (e.g. crop, commodity), and a custom colour palette, points are displayed on a map. Depending on the zoom level and extent, points are clustered dynamically for best display. Any cluster can be selected to see the full metadata about the evidence points it contains. 

- **Filtering**. Data can be filtered by property in real time, using multiple filters within a property, and using multiple properties to filter. 

- **Slicing of dimensionality**. Given continuous data (e.g. publication year, time, or an effect size), the map allows real time 'slicing' of the dataset along one or many dimensions. 

- **Abstract and funding logos**. Provide attribution to your funders and partner institutions by including their logos at the top of your map view.

## Technology

The mapping components are written using D3.js. The website is static, and can be compiled using the Jekyll static site builder. All code is TypeScript. 

## How can I use it?

You can host one or many evidence maps using GitHub Pages' free hosting.

Thalloo is provided as a Jekyll gem theme. A starter template will be provided, which can be forked (coming soon), or the gem can be installed directly as a Jekyll template when setting up your site. 

A simple JSON configuration file is required, alongside a UTF8 tab delimited sheet of your coded data. Note that Thalloo currently only support geographical data, so each data row must have a latitude and longitude in decimal degrees.

[Code being developed under MIT license here](https://github.com/AndrewIOM/thalloo)

[An example instance is available to view here](https://oxlel.github.io/evidencemaps)

---

## Developer Instructions

Use ``yarn`` to setup the development environment. A simple ``yarn install`` followed by ``yarn run build:dev`` will watch the files for any changes.