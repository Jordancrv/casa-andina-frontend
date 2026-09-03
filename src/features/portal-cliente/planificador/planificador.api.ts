export const getRecommendations = async (budget: number, climate: string) => {
  const response = await fetch(`/api/planificador?budget=${budget}&climate=${climate}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
  return response.json()
}