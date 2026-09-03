# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ManagementSystem.csproj", "./"]
RUN dotnet restore "ManagementSystem.csproj"
COPY . .
RUN dotnet build "ManagementSystem.csproj" -c Release -o /app/build
RUN dotnet publish "ManagementSystem.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "ManagementSystem.dll"]
