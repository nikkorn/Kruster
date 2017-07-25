"use strict";

function Kruster(tableBody, scrollableParent, options) 
{
	// TODO Check validity of table and scrollableParent.

	// The default options.
	this.defaultOptions = {
		clusterSize: 100
	}

	// The scrollable parent.
	this._scrollableParent = scrollableParent;

	// The table body.
	this._tableBody = tableBody;

	// If we have not passed in any options, then just swap it for the defaults.
	this.options = options || this.defaultOptions;

	// Our array of clusters.
	this._clusters = [];

	// Our array of table rows
	this._rows = [];

	// Determine the cluster size.
	this._clusterSize = this.options.clusterSize || this.defaultOptions.clusterSize;

	// The smallest cluster height in pixels.
	this._minClusterHeight = null;

	// The scroll position at the last cluster update.
	this._scrollPositionAtLastUpdate = this._scrollableParent.scrollTop;

	// The scroll update handler.
	this._scrollUpdateHandler = null;

	/**
	 * Initialisation.
	 */
	this._init = function() 
	{
		// Create the clusters.
		this._createClusters();

		// Handle changes of the scrollable parent's scrollable position.
		this._scrollUpdateHandler = this._onParentScroll.bind(this);
		scrollableParent.addEventListener("scroll", this._scrollUpdateHandler);

		// Do the initial update of setting cluster visibility.
		this._updateClusterVisibility();
	};

	/**
	 * Refresh the instance to reflect changes to the table or scrollable parent.
	 */
	this.refresh = function ()
	{
		// TODO Refresh.
	};

	/**
	 * Get an array of all of the table rows excluding placeholders.
	 */
	this.getRows = function ()
	{
		return this._rows;
	};

	/**
	 * Get a row at the specified index.
	 */
	this.getRowAt = function (index)
	{
		return this._rows[index];
	};

	/**
	 * Get the index of the specified row element.
	 */
	this.getRowIndex = function (rowElement)
	{
		// Iterate over all the rows in the table until we have found the one we are after.
		for (var i = 0; i < this._rows.length; i++) 
		{
			// Get the current row.
			var row = this._rows[i];

			// Is this the row element we are looking for?
			if(row === rowElement) 
			{
				return i;
			}
		}

		// This row element was not found in the table.
		return -1;
	};

	/**
	 * Get the table body without the DOM and style modifications made by Kruster.
	 */
	this.getCleanTable = function ()
	{
		// Create a clone of the current table.
		var tableBodyClone = this._tableBody.cloneNode(true);

		// Cleanse the table of any placeholders and styles applied by Kruster.
		this._cleanTable(tableBodyClone);

		// Return the clean table.
		return tableBodyClone;
	};

	/**
	 * Destroy this instance.
	 */
	this.destroy = function ()
	{
		// Remove scroll event listener.
		scrollableParent.removeEventListener("scroll", this._scrollUpdateHandler);

		// Clean the table.
		this._cleanTable(this._tableBody);
	};

	/**
	 * Clean the table, removing placeholders and displaying hidden rows.
	 */
	this._cleanTable = function (table)
	{
		// Iterate over all the rows in the table.
		for (var i = 0; i < table.rows.length; i++) 
		{
			// Get the current row.
			var row = table.rows[i];

			// Remove this row if it is a placeholder, otherwise show it if it's hidden.
			if (row.className === "kruster-placeholder")
			{
				table.removeChild(row);
				i--;
			}
			else
			{
				row.style.display = "table-row";
			}
		}
	};

	/**
	 * Create the table clusters.
	 */
	this._createClusters = function() 
	{
		// Create an empty clusters array.
		var clusters = [];

		// Iterate over all the rows in the table.
		for (var i = 0; i < this._tableBody.rows.length; i++) 
		{
			// Get the current row.
			var row = this._tableBody.rows[i];

			// Keep track of the original sequence of rows.
			this._rows.push(row);

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
			cluster.placeholder = this._tableBody.insertRow(cluster.firstRowIndex);

			// Give the placeholder the appropriate height.
			cluster.placeholder.style.height = cluster.height + "px";

			cluster.placeholder.className = "kruster-placeholder";

			// It will no be visible initially.
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
		cluster.placeholder.style.display = cluster.isDisplayed ? "none" : "table-row";

		// Call the relevant onshow/onhide callback.
		if (cluster.isDisplayed) 
		{
			this.options.onClusterShow && this.options.onClusterShow({
				clusterIndex: cluster.clusterIndex,
				rows: cluster.rows
			});
		} 
		else 
		{
			this.options.onClusterHide && this.options.onClusterHide({
				clusterIndex: cluster.clusterIndex,
				rows: cluster.rows
			});
		}
	};

	/**
	 * Called when the parent scrollable area has been scrolled.
	 */
	this._onParentScroll = function() 
	{
		// Get the amount the scrollable parent is scolled by.
		var scrollTop = this._scrollableParent.scrollTop;

		// Determine whether we should update our clusters based on
		// how far we have scrolled since the last cluster update.
		if (scrollTop > (this._scrollPositionAtLastUpdate + this._minClusterHeight) ||
			scrollTop < (this._scrollPositionAtLastUpdate - this._minClusterHeight)) 
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
	this._updateClusterVisibility = function() 
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
};

module.exports = Kruster;