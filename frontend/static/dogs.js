window.dogsManager = function () {
    return Alpine.reactive({
        owners: [],

        async fetchOwners() {
            const res = await fetch(`${window.config.apiBaseUrl}/owners`);
            this.owners = await res.json();
        },

        async addOwner() {
            const givenName = prompt("Enter given name:");
            const surname = prompt("Enter surname:");
            if (!givenName || !surname) return;

            await fetch(`${window.config.apiBaseUrl}/owners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ givenName, surname })
            });
            this.fetchOwners();
        },

        async removeOwner(ownerId) {
            if (!confirm("Are you sure?")) return;
            await fetch(`${window.config.apiBaseUrl}/owners/${ownerId}`, { method: 'DELETE' });
            this.fetchOwners();
        },

        async addDog(ownerId) {
            const name = prompt("Enter dog name:");
            if (!name) return;
            await fetch(`${window.config.apiBaseUrl}/owners/${ownerId}/dogs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: ownerId,
                    name: name,
                })
            });
            this.fetchOwners();
        },

        async updateDog(ownerId, dogId, oldName) {
            const newName = prompt("Update dog name:", oldName);
            if (!newName || newName === oldName) return;
            await fetch(`${window.config.apiBaseUrl}/owners/${ownerId}/dogs/${dogId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            this.fetchOwners();
        },

        async removeDog(ownerId, dogId) {
            if (!confirm("Are you sure?")) return;
            await fetch(`${window.config.apiBaseUrl}/owners/${ownerId}/dogs/${dogId}`, { method: 'DELETE' });
            this.fetchOwners();
        },

        init() {
            this.fetchOwners();
        }
    });
};
