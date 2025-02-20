namespace ImagesAPI.Services.Interfaces
{
    /// <summary>
    /// Defines basic CRUD operations for a collection of type <typeparamref name="T"/>.
    /// </summary>
    /// <typeparam name="T">The type of the items in the collection.</typeparam>
    public interface ICollectionService<T>
    {
        /// <summary>
        /// Retrieves all items from the collection.
        /// </summary>
        /// <returns>A list of all items in the collection.</returns>
        Task<List<T>> GetAll();

        /// <summary>
        /// Retrieves an item by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the item to retrieve.</param>
        /// <returns>The item with the specified identifier.</returns>
        Task<T> Get(string id);

        /// <summary>
        /// Creates a new item in the collection.
        /// </summary>
        /// <param name="model">The item to create.</param>
        /// <returns>A boolean indicating whether the creation was successful.</returns>
        Task<bool> Create(T model);

        /// <summary>
        /// Updates an existing item in the collection.
        /// </summary>
        /// <param name="id">The identifier of the item to update.</param>
        /// <param name="model">The updated item.</param>
        /// <returns>A boolean indicating whether the update was successful.</returns>
        Task<bool> Update(string id, T model);

        /// <summary>
        /// Deletes an item from the collection by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the item to delete.</param>
        /// <returns>A boolean indicating whether the deletion was successful.</returns>
        Task<bool> Delete(string id);
    }
}
