
function Cluster(tableBody, scrollableParent, options)
{
    // TODO Check validity of table and scrollableParent.

    // The default options.
    this.defaultOptions = {
        clusterSize: 100
    }

    // The scrollable parent.
    this._scrollableParent = scrollableParent;

    // If we have not passed in any options, then just swap it for the defaults.
    this.options = options || this.defaultOptions;

    // Our array of clusters.
    this._clusters = [];

    // Determine the cluster size.
    this._clusterSize = this.options.clusterSize || this.defaultOptions.clusterSize;

    // The smallest cluster height in pixels.
    this._minClusterHeight = null;

    // The scroll position at the last cluster update.
    this._scrollPositionAtLastUpdate = this._scrollableParent.scrollTop;

    /**
     * Initialisation.
     */
    this._init = function ()
    {
      // Create the clusters.
      this._createClusters();

      // Handle changes of the scrollable parent's scrollabel position.
      scrollableParent.addEventListener("scroll", this._onParentScroll.bind(this));

      // Do the initial update of setting cluster visibility.
      this._updateClusterVisibility();
    };

    /**
     * Create the table clusters.
     */
    this._createClusters = function ()
    {
      // Create an empty clusters array.
      var clusters = [];

      // Iterate over all the rows in the table.
      for (var i = 0; i < tableBody.rows.length; i++)
      {
          // Get the current row.
          var row = tableBody.rows[i];

          // Is this a new cluster?
          if (i % this._clusterSize == 0)
          {
              // Create a new cluster with the current row in it.
              clusters.push({
                  firstRowIndex: i,
                  clusterIndex: clusters.length,
                  rows: [row],
                  height: row.offsetHeight,
                  isDisplayed: true
              });
          }
          else
          {
              // Get the current cluster.
              var currentCluster = clusters[clusters.length - 1];

              // Push the current row into the current cluster.
              currentCluster.rows.push(row);

              // Modify the height of this cluster to reflect the extra row height.
              currentCluster.height += row.offsetHeight;
          }
      }

      // TODO Get the column widths, these will need to be applied to TDs added to placeholder rows.

      // Each cluster will have a placeholder row to replace it when we are not viewing it.
      // This will be injected at the cluster position in the table.
      for (var i = clusters.length - 1; i >= 0; i--)
      {
          // Get the current cluster.
          var cluster = clusters[i];

          // Create and inject the cluster placeholder row.
          cluster.placeholder = tableBody.insertRow(cluster.firstRowIndex);

          // Give the placeholder the appropriate height.
          cluster.placeholder.style.height = cluster.height;

          // It will no be visibile initially.
          cluster.placeholder.style.display = "none";

          // TODO Add TDs to placholder with the table column widths. This will
          // stop the columns from resizing when clusters are hidden or shown.
      }

      // Update clusters with their offset from the top of the scrollable area
      // to speed up the process of mapping cluster positions to scroll position
      // Also get the smallest cluster height. We will need this to help
      // determine how often to check whther clusters need updating.
      var overallOffsetTop = 0;
      for (var i = 0; i < clusters.length; i++)
      {
        // Update the clusters offset.
        clusters[i].offsetTop = overallOffsetTop;

        // Update the overall offset with th height of this cluster.
        overallOffsetTop += clusters[i].height;

        // Update the minimum cluster height if we need to.
        if (this._minClusterHeight)
        {
          if (clusters[i].height < this._minClusterHeight)
          {
            this._minClusterHeight = clusters[i].height;
          }
        }
        else
        {
          this._minClusterHeight = clusters[i].height;
        }
      }

      this._clusters = clusters;
    };

    /**
     * Toggle the visibility of a table cluster.
     */
    this._toggleCluster = function(cluster)
    {
      // Toggle the clusters 'isDisplayed' flag.
      cluster.isDisplayed = !cluster.isDisplayed;

      // Toggle the display value for every row in this cluster.
      var rowDisplayValue = cluster.isDisplayed ? "table-row" : "none";
      for (var i = 0; i < cluster.rows.length; i++)
      {
          cluster.rows[i].style.display = rowDisplayValue;
      }

      // Toggle the display value for the placeholder for this cluster.
      cluster.placeholder.style.display = cluster.isDisplayed ? "none": "table-row";

      // Call the relevant onshow/onhide callback.
      if (cluster.isDisplayed)
      {
        this.options.onClusterShow && this.options.onClusterShow({ clusterIndex: cluster.clusterIndex, rows: cluster.rows });
      }
      else
      {
        this.options.onClusterHide && this.options.onClusterHide({ clusterIndex: cluster.clusterIndex, rows: cluster.rows });
      }
    };

    /**
     * Called when the parent scrollable area has been scrolled.
     */
    this._onParentScroll = function ()
    {
      // Get the amount the scrollable parent is scolled by.
      var scrollTop = this._scrollableParent.scrollTop;

      // Determine whether we should update our clusters based on
      // how far we have scrolled since the last cluster update.
      if (scrollTop > (this._scrollPositionAtLastUpdate + this._minClusterHeight)
          || scrollTop < (this._scrollPositionAtLastUpdate - this._minClusterHeight))
      {
        // Update the cluster visibility.
        this._updateClusterVisibility();

        // Update the scroll position for this update.
        this._scrollPositionAtLastUpdate = scrollTop;
      }
    };

    /**
     * Update the visibility of the clusters which require a visibility change.
     */
    this._updateClusterVisibility = function ()
    {
      var visibleScrollAreaTop    = this._scrollableParent.scrollTop;
      var visibleScrollAreaBottom = visibleScrollAreaTop + this._scrollableParent.clientHeight;
      var clustersToShow          = [];

      for (var i = 0; i < this._clusters.length; i++)
      {
        // Get the current cluster.
        var cluster = this._clusters[i];

        // Does this cluster overlap the visible area of he scrollable parent.
        if (visibleScrollAreaTop < (cluster.offsetTop + cluster.height) && cluster.offsetTop < visibleScrollAreaBottom)
        {
          // This cluster is currently in the viewable portion of the scrollable parent.          
          if (clustersToShow.indexOf(cluster) === -1)
          {
            clustersToShow.push(cluster);
          }

          // Add previous cluster.
          if (this._clusters[i - 1] && clustersToShow.indexOf(this._clusters[i - 1]) === -1)
          {
            clustersToShow.push(this._clusters[i - 1]);
          }

          // Add next cluster.
          if (this._clusters[i + 1] && clustersToShow.indexOf(this._clusters[i + 1]) === -1)
          {
            clustersToShow.push(this._clusters[i + 1]);
          }
        }
        else
        {
          // Hide any clusters that shouldn't be shown but are shown.
          if (cluster.isDisplayed && clustersToShow.indexOf(cluster) === -1) 
          {
            this._toggleCluster(cluster);
          }
        }
      }

      // Toggle the clusters in view to be displayed if they are not already.
      for (var i = 0; i < clustersToShow.length; i++)
      {
        if (!clustersToShow[i].isDisplayed)
        {
          this._toggleCluster(clustersToShow[i]);
        }
      }
    };

    this._init();
}
