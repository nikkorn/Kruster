// Type definitions for Kruster 0.0.5
// Project: Kruster
// Definitions by: nikolas howard <https://github.com/nikkorn>

export as namespace Kruster;

export = Kruster;

declare class Kruster
{
	/**
	 * Create a new instance of Kruster and apply modifications to target table body.
	 * @param config the configuration options.
	 */
	constructor(config: Kruster.Configuration);

	/**
	 * Returns the table body without the DOM and style modifications made by Kruster.
	 */
	getCleanTable(): Element;

	/**
	 * Get an array of all of the table rows excluding placeholders.
	 */
	getRows(): HTMLTableRowElement[];

	/**
	 * Get the row element at the specified index.
	 * @param index The row index.
	 */
	getRowAt(index: number): HTMLTableRowElement;

	/**
	 * Get the index of the specified row element.
	 * @param rowElement The row element.
	 */
	getRowIndex(rowElement: HTMLTableRowElement): number;

	/**
	 * Destroys the instance, reverting the table to its original state.
	 */
	destroy(): void;
}

declare namespace Kruster
{
	/**
	 * Configuration options to create a new instance of Kruster.
	 */
	interface Configuration
	{
		/**
		 * The target table body.
		 */
		tableBody: Element;

		/**
		 * The potentially scrollable parent of the table body.
		 */
		scrollableParent: Element;

		/**
		 * The size of the the table row clusters. Default: 100.
		 */
		clusterSize?: number;

		/**
		 * Callback which is called when a cluster is made visible.
		 */
		onClusterShow?(event: ClusterChangeEvent): void;		

		/**
		 * Callback which is called when a cluster is made hidden.
		 */
		onClusterHide?(event: ClusterChangeEvent): void;
	}

	/**
	 * Cluster visibility change event details.
	 */
	interface ClusterChangeEvent
	{
		/**
		 * The cluster index.
		 */
		clusterIndex: number;

		/**
		 * The row elements of the cluster.
		 */
		rows: HTMLTableRowElement[];	
	}
}

