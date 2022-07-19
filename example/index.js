/** The Kruster instance. */
let instance = null;

/**
 * Initialise the Kruster instance.
 */
function initialise () {
    if (instance) {
        console.warn("instance exists", instance);
    }

    const clusterSize = parseInt(document.getElementById("cluster-size").value, 10);

    instance = new Kruster({
        tableBody: document.getElementById("table-body"),
        scrollableParent: document.getElementById("scrollable-container"),
        clusterSize: clusterSize
    });
}

/**
 * Refresh the Kruster instance.
 */
function refresh () {
    if (!instance) {
        console.warn("not initialised");
        return;
    }

    instance.refresh();
}

/**
 * Destroy the Kruster instance.
 * @param clean Whether to clean the table.
 */
function destroy (clean) {
    if (!instance) {
        console.warn("not initialised");
        return;
    }

    instance.destroy(clean);

    instance = null;
}