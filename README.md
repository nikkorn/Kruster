# Kruster
> A small tool to help improve the rendering performance of very large HTML tables.

[![Build Status](https://travis-ci.org/nikkorn/Kruster.svg?branch=master)](https://travis-ci.org/nikkorn/Kruster)

## Install

```sh
$ npm install --save kruster
```

## Documentation

### Examples

#### HTML 

```html
<div id="scrollable-container">
  <table>
    <colgroup>
      <col style="width:100px">
      <col style="width:150px">
      <col style="width:150px">
      <col style="width:150px">
      <col style="width:250px">
      <col style="width:250px">
    </colgroup>
    <tbody id="table-body">
      <tr>
        <td colspan="1"><img src="images/31.jpg"></td>
        <td colspan="1">0</td>
        <td colspan="1">lily</td>
        <td colspan="1">(025)-016-5434</td>
        <td colspan="1">lily.billy@email.com</td>
        <td colspan="1">43 some road<br>dean park<br><br><br>mega place</td>
      </tr>
      
      <!-- ... Plenty of other rows. Like, lots ... -->

      <tr>
        <td colspan="1"><img src="images/23.jpg"></td>
        <td colspan="1">200</td>
        <td colspan="1">oliver</td>
        <td colspan="1">05-891-394</td>
        <td colspan="1">oliver.pitters@email.com</td>
        <td colspan="1">937 burnsey road<br>middle<br>nowhere</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### JavaScript

```js
/** Create an instance of Kruster and cluster the target table rows. */
var kruster = new Kruster({ 
  tableBody: document.getElementById("table-body"), 
  scrollableParent: document.getElementById("scrollable-container") 
});
```
#### Options
| Option          |Type | Description |
| :--------------------|:- |:- |
| tableBody **(required)**  |DOM Element| The target table which contains the rows to cluster.|
| scrollableParent **(required)** |DOM Element| The scrollable parent that wraps the target table. Only clusters which reside in the visible portion of this element will be displayed.|
| clusterSize |number| The number of rows to each cluster. Smaller clusters mean more frequent updates but minimises the numer of rows being displayed. **Default: 100**  |
| onClusterShow |function| Callback which is called when a cluster is shown. An object containing the clusters index and contained rows are passed as an argument.|
| onClusterHide |function| Callback which is called when a cluster is hidden. An object containing the clusters index and contained rows are passed as an argument.|

### Methods

#### .refresh()

Refreshes the `Kruster` instance. This is required when the size of the table or the heights of any rows change in order to reassess the heights of any clusters.

#### .getRows()

Get an array of all of the table rows, excluding any cluster placeholder rows that were injected by `Kruster`.

#### .getRowAt(index)

Get a row at the specified index, excluding any cluster placeholder rows that were injected by `Kruster`.

#### .getRowIndex(rowElement)

Get the index of the specified row element in the clustered table, excluding any cluster placeholder rows that were injected by `Kruster`.

#### .getCleanTable()

Get the table body, cleansed of the DOM and style modifications made by `Kruster`. 

#### .destroy()

Destroys the instance and removes any DOM and style modifications made by `Kruster`.


## License

MIT © [Nikolas Howard]
