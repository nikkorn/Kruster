(function () {
    "use strict";

    function Kruster(options) {
        // The default options.
        this.defaultOptions = {
            clusterSize: 25,
            autoRefresh: false
        };

        // The scrollable parent.
        this._scrollableParent = options.scrollableParent;

        // The table body.
        this._tableBody = options.tableBody;

        // If we have not passed in any options, then just swap it for the defaults.
        this.options = options;

        // Our array of clusters.
        this._clusters = [];

        // Our array of table rows.
        this._rows = [];

        // Determine the cluster size.
        this._clusterSize = this.options.clusterSize || this.defaultOptions.clusterSize;

        // Determine whether we will be auto refreshing this instance.
        this._isAutoRefresh = this.options.autoRefresh || this.defaultOptions.autoRefresh;

        // The range of visible clusters for the last update.
        this._lastVisibleClusterRange = { firstIndex: null, lastIndex: null };

        // The scroll update handler.
        this._scrollUpdateHandler = null;

        // The id of the timeout waiting for the table to be displayed for a refresh.
        this._postponedRefreshTimeoutId = null;

        // The window resize handler used when auto-refreshing.
        this._windowResizeHandler = null;

        // The injected spacer rows.
        this._topSpacerRow = null;
        this._bottomSpacerRow = null;

        /**
         * Initialisation.
         */
        this._init = function () {
            // Create the clusters.
            this._createClusters();

            // Handle changes of the scrollable parent's scrollable position.
            this._scrollUpdateHandler = this._onParentScroll.bind(this);
            this._scrollableParent.addEventListener("scroll", this._scrollUpdateHandler);

            // If we are auto refreshing we will have to wait for window resize
            // events before asserting whether to refresh this instance.
            if (this._isAutoRefresh) {
                var self = this;

                // Intermittently handle window resize events and refresh this instance.
                this._windowResizeHandler = this._debounce(function () {
                    self.refresh();
                }, 250);

                window.addEventListener("resize", this._windowResizeHandler);
            }

            // Manually call the scroll handler to do the initial update of setting cluster visibility.
            this._scrollUpdateHandler();
        };

        /**
         * Clean the table, removing any DOM manipulations made by Kruster and displaying hidden rows.
         * @param table The table to clean.
         */
        this._cleanTable = function (table) {
            // No point in cleaning a table without rows.
            if (table.rows.length === 0) {
                return;
            }

            // Remove our spacer rows from the table.
            this._removeSpacerRows(table);

            // Show any rows in the table that had been hidden.
            for (var rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
                // Get the current row.
                var row = table.rows[rowIndex];

                if (row.style.display === "none") {
                    row.style.display = "table-row";
                }
            }
        };

        /**
         * Create the table clusters.
         */
        this._createClusters = function () {
            // Create an empty clusters array.
            var clusters = [];

            // Make sure we are getting a new rows array.
            this._rows = [];

            // We shouldn't have any kruster spacer rows in our table, but something might not have cleared up properly so we should try to remove them anyway.
            this._removeSpacerRows(this._tableBody);

            // Iterate over all the rows in the table.
            for (var i = 0; i < this._tableBody.rows.length; i++) {
                // Get the current row.
                var row = this._tableBody.rows[i];

                // Keep track of the original sequence of rows.
                this._rows.push(row);

                // Is this a new cluster?
                if (i % this._clusterSize == 0) {
                    // Create a new cluster with the current row in it.
                    clusters.push({
                        firstRowIndex: i,
                        clusterIndex: clusters.length,
                        rows: [row],
                        height: row.offsetHeight,
                        isDisplayed: true
                    });
                } else {
                    // Get the current cluster.
                    var currentCluster = clusters[clusters.length - 1];

                    // Push the current row into the current cluster.
                    currentCluster.rows.push(row);

                    // Modify the height of this cluster to reflect the extra row height.
                    currentCluster.height += row.offsetHeight;
                }
            }

            // Create the top spacer row and insert as the first table row.
            this._topSpacerRow = this._tableBody.insertRow(0);
            this._topSpacerRow.style.height = "0px";
            this._topSpacerRow.className = "kruster-spacer-row kruster-spacer-top";

            // Create the bottom spacer row and insert as the last table row.
            this._bottomSpacerRow = this._tableBody.insertRow();
            this._bottomSpacerRow.style.height = "0px";
            this._bottomSpacerRow.className = "kruster-spacer-row kruster-spacer-bottom";

            // Calculate the total height of all the rows.
            var totalHeight = 0;
            for (var i = 0; i < clusters.length; i++) {
                totalHeight += clusters[i].height;
            }

            // Update clusters with their offset from the top of the scrollable area
            // to speed up the process of mapping cluster positions to scroll position.
            var overallOffsetTop = 0;
            for (var i = 0; i < clusters.length; i++) {
                // Update the clusters top and bottom offset.
                clusters[i].offsetTop = overallOffsetTop;
                clusters[i].offsetBottom = totalHeight - (overallOffsetTop + clusters[i].height);

                // Update the overall offset with the height of this cluster.
                overallOffsetTop += clusters[i].height;
            }

            this._clusters = clusters;
        };

        /**
         * Remove any spacer rows from the body of the specified table.
         * @param table The table to remove any spacer rows from.
         */
        this._removeSpacerRows = function (table) {
            // Get any kruster spacer rows in the grid. There might be a top and bottom spacer.
            const krusterSpacerRows = table.getElementsByClassName("kruster-spacer-row");

            // Remove our kruster spacer rows from the table if there are any.
            while (krusterSpacerRows.length) {
                krusterSpacerRows[0].remove();
            }
        };

        /**
         * Toggle the visibility of a table cluster.
         */
        this._toggleCluster = function (cluster) {
            // Toggle the clusters 'isDisplayed' flag.
            cluster.isDisplayed = !cluster.isDisplayed;

            // Toggle the display value for every row in this cluster.
            var rowDisplayValue = cluster.isDisplayed ? "table-row" : "none";
            for (var i = 0; i < cluster.rows.length; i++) {
                cluster.rows[i].style.display = rowDisplayValue;
            }

            // Call the relevant onshow/onhide callback.
            if (cluster.isDisplayed) {
                this.options.onClusterShow &&
                    this.options.onClusterShow({
                        clusterIndex: cluster.clusterIndex,
                        rows: cluster.rows
                    });
            } else {
                this.options.onClusterHide &&
                    this.options.onClusterHide({
                        clusterIndex: cluster.clusterIndex,
                        rows: cluster.rows
                    });
            }
        };

        /**
         * Called when the parent scrollable area has been scrolled.
         */
        this._onParentScroll = function () {
            // There is no reason to go on if we have no clusters (meaning no rows).
            if (this._clusters.length === 0) {
                return;
            }

            // Get the amount the scrollable parent is scolled by.
            var scrollTop = this._scrollableParent.scrollTop;

            // Get the visible cluster range based on the new scroll position. This is essentailly the first and last index of the clusters that are visible within the scrollable parent.
            var visibleClusterRange = {
                firstIndex: this._getIndexOfClusterAtPoint(scrollTop),
                lastIndex: this._getIndexOfClusterAtPoint(scrollTop + this._scrollableParent.clientHeight)
            };

            // Determine whether we should update our clusters based on how far we have scrolled since the last cluster update.
            if (
                this._lastVisibleClusterRange.firstIndex !== visibleClusterRange.firstIndex ||
                this._lastVisibleClusterRange.lastIndex !== visibleClusterRange.lastIndex
            ) {
                // Update the cluster visibility.
                this._updateClusterVisibility(visibleClusterRange);

                // Update the last visible cluster range for this update.
                this._lastVisibleClusterRange = visibleClusterRange;
            }
        };

        /**
         * Get the cluster that overlaps the specified point.
         * @param point The point representing the vertical position.
         */
        this._getIndexOfClusterAtPoint = function (point) {
            for (var i = 0; i < this._clusters.length; i++) {
                // Get the current cluster.
                var cluster = this._clusters[i];

                // If the point lies between the top and the bottom of the current cluster then this is our cluster.
                if (point >= cluster.offsetTop && point <= cluster.offsetTop + cluster.height) {
                    return cluster.clusterIndex;
                }
            }
        };

        /**
         * Update the visibility of the clusters which require a visibility change.
         * @param visibleClusterRange An object representing the range of visible cluster by exposing a start and end cluster index.
         */
        this._updateClusterVisibility = function (visibleClusterRange) {
            var clustersToShow = [];

            // Get the first and last index of the clusters to show, this will include an extra one above and below.
            var firstIndex = visibleClusterRange.firstIndex > 0 ? visibleClusterRange.firstIndex - 1 : 0;
            var lastIndex =
                visibleClusterRange.lastIndex < this._clusters.length - 1
                    ? visibleClusterRange.lastIndex + 1
                    : this._clusters.length - 1;

            // Iterate over the clusters that are visible within the scrollable parent ...
            for (var index = firstIndex; index <= lastIndex; index++) {
                // ... And add it to the list of clusters to be shown.
                clustersToShow.push(this._clusters[index]);
            }

            this._topSpacerRow.style.display = "none";
            this._bottomSpacerRow.style.display = "none";

            // Hide any clusters that are currently being displayed but shouldn't be.
            for (var i = 0; i < this._clusters.length; i++) {
                // Get the current cluster.
                var cluster = this._clusters[i];

                if (cluster.isDisplayed && clustersToShow.indexOf(cluster) === -1) {
                    this._toggleCluster(cluster);
                }
            }

            // Update the heights of the buffer rows.
            this._topSpacerRow.style.height = clustersToShow[0].offsetTop + "px";
            this._bottomSpacerRow.style.height = clustersToShow[clustersToShow.length - 1].offsetBottom + "px";

            // Toggle the clusters in view to be displayed if they are not already.
            for (var i = 0; i < clustersToShow.length; i++) {
                if (!clustersToShow[i].isDisplayed) {
                    this._toggleCluster(clustersToShow[i]);
                }
            }

            this._topSpacerRow.style.display = "";
            this._bottomSpacerRow.style.display = "";
        };

        /**
         * Helper debounce function.
         */
        this._debounce = function (func, duration) {
            var timeout;
            return function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    func();
                }, duration);
            };
        };

        this._init();
    }

    /**
     * Refresh the instance to reflect changes to the table layout.
     */
    Kruster.prototype.refresh = function () {
        // Determine whether the table is actually displayed at the moment.
        // If it is not, postpone the refresh until it is.
        if (this._tableBody.offsetParent === null) {
            // Check that there is not already a postponed refresh.
            if (!this._postponedRefreshTimeoutId) {
                var self = this;

                // Attempt a refresh in a little while.
                this._postponedRefreshTimeoutId = setTimeout(function () {
                    self._postponedRefreshTimeoutId = null;

                    self.refresh();
                }, 50);
            }
        } else {
            this._postponedRefreshTimeoutId = null;

            // Clean the target table body.
            this._cleanTable(this._tableBody);

            // Recreate the clusters.
            this._createClusters();

            // Manually call the scroll handler to do the update of setting cluster visibility.
            this._scrollUpdateHandler();
        }
    };

    /**
     * Get an array of all of the table rows excluding Kruster rows.
     */
    Kruster.prototype.getRows = function () {
        return this._rows;
    };

    /**
     * Get a row at the specified index.
     */
    Kruster.prototype.getRowAt = function (index) {
        return this._rows[index];
    };

    /**
     * Get the index of the specified row element.
     */
    Kruster.prototype.getRowIndex = function (rowElement) {
        // Iterate over all the rows in the table until we have found the one we are after.
        for (var i = 0; i < this._rows.length; i++) {
            // Get the current row.
            var row = this._rows[i];

            // Is this the row element we are looking for?
            if (row === rowElement) {
                return i;
            }
        }

        // This row element was not found in the table.
        return -1;
    };

    /**
     * Get the table body without the DOM and style modifications made by Kruster.
     */
    Kruster.prototype.getCleanTable = function () {
        // Create a clone of the current table.
        var tableBodyClone = this._tableBody.cloneNode(true);

        // Cleanse the table of any DOM and style modifications applied by Kruster.
        this._cleanTable(tableBodyClone);

        // Return the clean table.
        return tableBodyClone;
    };

    /**
     * Destroy this instance.
     * @param removeTableModifications Whether to remove all modifications that kruster has made to the table. Default: true.
     */
    Kruster.prototype.destroy = function (removeTableModifications = true) {
        // Stop any postponed refresh.
        if (this._postponedRefreshTimeoutId) {
            clearTimeout(this._postponedRefreshTimeoutId);
        }

        // Stop listening for window resize events.
        if (this._windowResizeHandler) {
            window.removeEventListener("resize", this._windowResizeHandler);
        }

        // Remove scroll event listener.
        this._scrollableParent.removeEventListener("scroll", this._scrollUpdateHandler);

        // If the 'removeTableModifications' argument is true then remove any table modifications made by Kruster. 
        // In many cases this won't need to be done when we are throwing away the table at the same time as destroying this Kruster instance.
        if (removeTableModifications) {
            // Clean the table.
            this._cleanTable(this._tableBody);
        }

        // Empty our cluster and row arrays. Clear the spacer rows.
        this._rows = [];
        this._clusters = [];
        this._topSpacerRow = null;
        this._bottomSpacerRow = null;
    };

    // Export kruster.
    if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
        module.exports = Kruster;
    } else {
        if (typeof define === "function" && define.amd) {
            define([], function () {
                return Kruster;
            });
        } else {
            window.Kruster = Kruster;
        }
    }
})();
